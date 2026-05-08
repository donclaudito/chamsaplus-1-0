import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import ThinkingIndicator from '@/components/chat/ThinkingIndicator';
import PasteDataModal from '@/components/chat/PasteDataModal';
import ModelSelector from '@/components/chat/ModelSelector';
import LLMUsageBar from '@/components/chat/LLMUsageBar.jsx';
import DriveSourceConfig from '@/components/chat/DriveSourceConfig';
import CanvasPanel from '@/components/chat/CanvasPanel';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useLLMConfig } from '@/hooks/useLLMConfig';
import { useCanvasState } from '@/hooks/useCanvasState';
import { MODELS } from '@/lib/modelRouter';
import { SYSTEM_PROMPT } from '@/lib/systemPrompt';
import { DEFAULT_DRIVE_FOLDER_ID } from '@/lib/appConfig';

export default function Chat() {
  const { activeChat, activeChatId } = useOutletContext();
  const [isLoading, setIsLoading] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [usageLog, setUsageLog] = useState([]);
  const [driveFolderId, setDriveFolderId] = useState(
    () => localStorage.getItem('chamsa_drive_folder') || DEFAULT_DRIVE_FOLDER_ID
  );

  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  const { messages, setMessages, setMessagesAndPersist, resetMessages } = useChatMessages(activeChatId);
  const {
    manualModel, setManualModel,
    activeModel, activeLLMBadge,
    resolveModel, updateBadgeFromConfig,
  } = useLLMConfig();
  const {
    canvasContent, canvasTitle, canvasMode,
    openCanvas, closeCanvas, resetCanvas, toggleCanvasMode,
  } = useCanvasState();

  // Sync session on switch
  useEffect(() => {
    if (activeChat?.messages) resetMessages(activeChat.messages);
    else resetMessages([]);
    setUsageLog([]);
    closeCanvas();
  }, [activeChatId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSaveDriveFolder = useCallback((id) => {
    setDriveFolderId(id);
    localStorage.setItem('chamsa_drive_folder', id);
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!activeChatId || isLoading) return;

    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);
    resetCanvas();

    // Auto-title on first user message
    const userMessages = newMessages.filter(m => m.role === 'user');
    if (userMessages.length === 1) {
      const snippet = text.replace(/\s+/g, ' ').trim().slice(0, 50);
      const newTitle = snippet.length < text.trim().length ? snippet + '…' : snippet;
      base44.entities.ChatSession.update(activeChatId, { title: newTitle })
        .then(() => queryClient.invalidateQueries({ queryKey: ['chatSessions'] }));
    }

    const apiMessages = newMessages
      .filter(m => m.role !== 'data-block')
      .map(m => ({ role: m.role, content: m.content }));

    const dataBlocks = newMessages
      .filter(m => m.role === 'data-block')
      .map(m => `[DADO CLÍNICO: ${m.title}]\n${m.content}`)
      .join('\n\n');

    // Active skills
    let skillsContext = '';
    try {
      const allSkills = await base44.entities.CustomSkill.list('-created_date', 50);
      const activeSkills = allSkills.filter(s => s.is_active);
      if (activeSkills.length > 0) {
        skillsContext = '\n\n--- SKILLS PERSONALIZADAS ATIVAS ---\n' +
          activeSkills.map(s => `[SKILL: ${s.title}]\n${s.prompt_template}`).join('\n\n');
      }
    } catch (_) {}

    // RAG semantic search
    let driveContext = '';
    let hasVectorContext = false;
    if (driveFolderId) {
      try {
        const ragRes = await base44.functions.invoke('semanticSearch', {
          query: text,
          folder_id: driveFolderId,
          top_k: 6,
        });
        const chunks = ragRes.data?.chunks || [];
        if (chunks.length > 0 && chunks[0].score > 0.4) {
          hasVectorContext = true;
          driveContext = '\n\nCONTEXTO RECUPERADO VIA RAG (chunks mais relevantes):\n' +
            chunks
              .filter(c => c.score > 0.35)
              .map(c => `[${c.source_name} — sim: ${c.score.toFixed(2)}]\n${c.chunk_text}`)
              .join('\n\n---\n\n');
        }
      } catch (_) {}
    }

    const canvasModeInstruction = canvasMode
      ? '\n\n⚠️ MODO CANVAS ATIVO: Toda resposta desta sessão DEVE obrigatoriamente ser encapsulada na tag <CANVAS title="Título Descritivo">conteúdo completo aqui</CANVAS>. Sem exceções.'
      : '';

    const fullPrompt = dataBlocks
      ? `${SYSTEM_PROMPT}${skillsContext}${canvasModeInstruction}\n\nDADOS CLÍNICOS INDEXADOS:\n${dataBlocks}${driveContext}`
      : `${SYSTEM_PROMPT}${skillsContext}${canvasModeInstruction}${driveContext}`;

    const llmMessages = [
      { role: 'system', content: fullPrompt },
      ...apiMessages,
    ];

    const promptText = llmMessages.map(m => `${m.role}: ${m.content}`).join('\n');

    const hasDataBlocks = newMessages.some(m => m.role === 'data-block');
    const chosenModel = resolveModel(text, hasDataBlocks, hasVectorContext);

    try {
      let responseContent;
      let inputTokens = 0;
      let outputTokens = 0;

      // Unified LLM call — backend resolve provider, parse tags, return structured object
      const res = await base44.functions.invoke('invokeLLMUnified', {
        messages: llmMessages,
        model: chosenModel,
      });
      const { content: llmContent, canvas: parsedCanvas, searchPrompt: extractedSearchPrompt, usage } = res.data;
      responseContent = llmContent;
      inputTokens  = usage?.prompt_tokens     || Math.round(promptText.length / 4);
      outputTokens = usage?.completion_tokens || Math.round(responseContent.length / 4);
      updateBadgeFromConfig(res.data.provider !== 'base44' && res.data.provider !== 'groq' ? { model_id: res.data.model, model_label: res.data.model } : null);

      // Open canvas if content present and canvas mode active
      if (parsedCanvas && canvasMode) {
        openCanvas(parsedCanvas.title, parsedCanvas.content);
      }

      // Track usage
      setUsageLog(prev => [...prev, { modelId: chosenModel, inputTokens, outputTokens }]);

      // Persist usage
      const now = new Date();
      const rates = {
        'claude_sonnet_4_6': { input: 0.003, output: 0.015 },
        'llama-3.3-70b-versatile': { input: 0.0001, output: 0.0001 },
        'gpt_5_mini': { input: 0.00015, output: 0.0006 },
      };
      const r = rates[chosenModel] || { input: 0.001, output: 0.002 };
      const estimatedCost = (inputTokens / 1000) * r.input + (outputTokens / 1000) * r.output;
      const modelMeta = MODELS.find(m => m.id === chosenModel);
      base44.entities.LLMUsageLog.create({
        model_id: chosenModel,
        model_label: modelMeta?.label || chosenModel,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        estimated_cost_usd: estimatedCost,
        session_id: activeChatId,
        user_id: newMessages.find(m => m.role === 'user')?.created_by || '',
        date_key: now.toISOString().slice(0, 10),
        month_key: now.toISOString().slice(0, 7),
      });

      const assistantMsg = {
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString(),
        searchPrompt: extractedSearchPrompt,
      };
      const updatedMessages = [...newMessages, assistantMsg];
      setMessagesAndPersist(updatedMessages);
    } catch (error) {
      const errorMsg = {
        role: 'assistant',
        content: `⚠️ **Aviso de Sistema:** ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessagesAndPersist([...newMessages, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [activeChatId, isLoading, messages, driveFolderId, canvasMode]);

  const handleTool = useCallback((toolId) => {
    if (toolId === 'canvas') toggleCanvasMode();
  }, [toggleCanvasMode]);

  const handlePasteData = useCallback((title, content) => {
    const dataMsg = { role: 'data-block', title, content, timestamp: new Date().toISOString() };
    const newMessages = [...messages, dataMsg];
    setMessages(newMessages);
    setTimeout(() => {
      sendMessage(`Analise os dados clínicos "${title}" que acabei de fornecer. Faça uma análise completa com Red Flags, hipóteses e recomendações.`);
    }, 500);
  }, [messages, sendMessage]);

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Crie uma nova sessão para começar.</p>
      </div>
    );
  }

  const modelForDisplay = manualModel || activeModel;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Chat Column */}
      <div className={`flex flex-col min-w-0 transition-all duration-300 ${canvasContent ? 'w-[400px] shrink-0 border-r border-border' : 'flex-1'}`}>
        <LLMUsageBar usageLog={usageLog} />

        {/* Model routing bar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border bg-card/50 text-xs">
          <div className="flex items-center gap-2">
            <DriveSourceConfig folderId={driveFolderId} onSave={handleSaveDriveFolder} />
            <span className="text-muted-foreground/50 font-mono hidden sm:inline">
              {manualModel ? '🔒 Modelo fixo' : '🤖 Auto-routing ativo'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {activeLLMBadge && (
              <span className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-500 border border-indigo-400/30 px-2 py-0.5 rounded-full text-[10px] font-semibold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                {activeLLMBadge.label} · {activeLLMBadge.modelId}
              </span>
            )}
            {!manualModel && (
              <button
                onClick={() => setManualModel(activeModel)}
                className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 hidden sm:block"
              >
                fixar modelo
              </button>
            )}
            {manualModel && (
              <button
                onClick={() => setManualModel(null)}
                className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 hidden sm:block"
              >
                voltar auto
              </button>
            )}
            <ModelSelector
              selectedModel={modelForDisplay}
              onChange={(id) => setManualModel(id)}
              autoMode={!manualModel}
            />
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                message={msg}
                onRetryWithoutCanvas={
                  msg.role === 'assistant' && canvasContent && i === messages.length - 1
                    ? () => closeCanvas()
                    : undefined
                }
              />
            ))}
            {isLoading && <ThinkingIndicator />}
          </div>
        </div>

        <ChatInput
          onSend={sendMessage}
          onPaste={() => setShowPaste(true)}
          onTool={handleTool}
          isLoading={isLoading}
          canvasMode={canvasMode}
        />

        <PasteDataModal
          open={showPaste}
          onClose={() => setShowPaste(false)}
          onSubmit={handlePasteData}
        />
      </div>

      {/* Canvas Panel */}
      {canvasContent && (
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <CanvasPanel
            content={canvasContent}
            title={canvasTitle}
            onClose={closeCanvas}
          />
        </div>
      )}
    </div>
  );
}