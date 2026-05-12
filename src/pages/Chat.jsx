import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import ThinkingIndicator from '@/components/chat/ThinkingIndicator';
import PasteDataModal from '@/components/chat/PasteDataModal';
import ModelSelector from '@/components/chat/ModelSelector.jsx';
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
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [usageLog, setUsageLog] = useState([]);
  const [driveFolderId, setDriveFolderId] = useState(DEFAULT_DRIVE_FOLDER_ID);
  const [uploadedDocs, setUploadedDocs] = useState([]);

  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  // Load drive folder per user — reage a mudanças de conta
  useEffect(() => {
    const key = `chamsa_drive_folder_${user?.email || 'default'}`;
    const saved = localStorage.getItem(key);
    setDriveFolderId(saved || DEFAULT_DRIVE_FOLDER_ID);
  }, [user?.email]);

  const { messages, setMessages, setMessagesAndPersist, resetMessages, isSaving, saveError } = useChatMessages(activeChatId, {
    folderId: driveFolderId,
    sessionTitle: activeChat?.title,
  });
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
    setUploadedDocs([]);
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
    const email = user?.email || 'default';
    localStorage.setItem(`chamsa_drive_folder_${email}`, id);
  }, [user?.email]);

  const handleUploadDocument = useCallback(async (file) => {
    if (!activeChatId) return;
    const docId = `${Date.now()}_${file.name}`;
    setUploadedDocs(prev => [...prev, { id: docId, name: file.name, status: 'processing' }]);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.functions.invoke('processUploadedDocument', {
        file_url,
        file_name: file.name,
        file_type: file.type,
        session_id: activeChatId,
      });

      if (res.data?.success) {
        setUploadedDocs(prev =>
          prev.map(d => d.id === docId ? { ...d, status: 'ready', folderId: res.data.folder_id } : d)
        );
        // Send an automatic message informing the document was indexed
        sendMessage(`Acabei de enviar o documento "${file.name}". Ele foi indexado e está disponível para consulta. Faça um resumo do documento.`);
      } else {
        throw new Error(res.data?.error || 'Erro desconhecido');
      }
    } catch (err) {
      setUploadedDocs(prev =>
        prev.map(d => d.id === docId ? { ...d, status: 'error' } : d)
      );
    }
  }, [activeChatId]);

  const handleRemoveDoc = useCallback((docId) => {
    setUploadedDocs(prev => prev.filter(d => d.id !== docId));
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

    // RAG semantic search — Drive folder + uploaded docs na sessão
    let driveContext = '';
    let hasVectorContext = false;

    const ragFolders = [];
    if (driveFolderId) ragFolders.push(driveFolderId);
    const readyDocs = uploadedDocs.filter(d => d.status === 'ready');
    if (readyDocs.length > 0) ragFolders.push(`upload_${activeChatId}`);

    for (const folderId of ragFolders) {
      try {
        const ragRes = await base44.functions.invoke('semanticSearch', {
          query: text,
          folder_id: folderId,
          top_k: 6,
        });
        const chunks = ragRes.data?.chunks || [];
        if (chunks.length > 0 && chunks[0].score > 0.35) {
          hasVectorContext = true;
          driveContext += '\n\nCONTEXTO RECUPERADO VIA RAG (chunks mais relevantes):\n' +
            chunks
              .filter(c => c.score > 0.3)
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
      const { content: llmContent, canvas: parsedCanvas, searchPrompt: extractedSearchPrompt, pubmedResults, usage } = res.data;
      responseContent = llmContent;
      inputTokens  = usage?.prompt_tokens     || Math.round(promptText.length / 4);
      outputTokens = usage?.completion_tokens || Math.round(responseContent.length / 4);
      updateBadgeFromConfig(res.data.provider !== 'base44' && res.data.provider !== 'groq' ? { model_id: res.data.model, model_label: res.data.model } : null);

      // Open canvas: usa conteúdo parseado ou fallback com a resposta completa
      if (canvasMode) {
        if (parsedCanvas) {
          openCanvas(parsedCanvas.title, parsedCanvas.content);
        } else {
          // Fallback: abre o Canvas com a resposta completa mesmo sem tag <CANVAS>
          openCanvas('Resposta', responseContent);
        }
      }

      // Track usage
      setUsageLog(prev => [...prev, { modelId: chosenModel, inputTokens, outputTokens }]);

      // Persist usage via backend (avoids RLS issues)
      const modelMeta = MODELS.find(m => m.id === chosenModel);
      base44.functions.invoke('logLLMUsage', {
        model_id: chosenModel,
        model_label: modelMeta?.label || chosenModel,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        session_id: activeChatId,
      }).catch(() => {});

      const assistantMsg = {
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString(),
        searchPrompt: extractedSearchPrompt,
        pubmedResults: pubmedResults || null,
      };
      const updatedMessages = [...newMessages, assistantMsg];
      setMessagesAndPersist(updatedMessages);
    } catch (error) {
      const friendlyMessage = error.message?.includes('network') || error.message?.includes('fetch')
        ? '⚠️ **Erro de conexão:** Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.'
        : error.message?.includes('timeout')
        ? '⚠️ **Tempo esgotado:** A requisição demorou demais. Tente uma mensagem mais curta ou tente novamente.'
        : `⚠️ **Erro ao gerar resposta:** ${error.message || 'Erro desconhecido. Tente novamente.'}`;

      const errorMsg = {
        role: 'assistant',
        content: friendlyMessage,
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
      <div className="flex-1 flex items-center justify-center" role="status" aria-label="Nenhuma sessão ativa">
        <p className="text-muted-foreground text-sm">Crie uma nova sessão para começar.</p>
      </div>
    );
  }

  const modelForDisplay = manualModel || activeModel;

  const chatColumn = (
    <div className="flex flex-col h-full min-h-0 min-w-0">
        {/* Save status indicator */}
        {(isSaving || saveError) && (
          <div className={`flex items-center justify-center gap-1.5 px-3 py-1 text-[11px] font-medium ${saveError ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
            {isSaving && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse inline-block" />
                Salvando histórico...
              </>
            )}
            {saveError && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block" />
                Erro ao salvar histórico — verifique sua conexão
              </>
            )}
          </div>
        )}
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
                aria-label="Fixar modelo atual"
              >
                fixar modelo
              </button>
            )}
            {manualModel && (
              <button
                onClick={() => setManualModel(null)}
                className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 hidden sm:block"
                aria-label="Voltar para roteamento automático de modelo"
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
          <div className="max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto space-y-4">
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
          onUpload={handleUploadDocument}
          onRemoveDoc={handleRemoveDoc}
          uploadedDocs={uploadedDocs}
          isLoading={isLoading}
          canvasMode={canvasMode}
        />

        <PasteDataModal
          open={showPaste}
          onClose={() => setShowPaste(false)}
          onSubmit={handlePasteData}
        />
    </div>
  );

  // Mobile: canvas como overlay fullscreen
  if (canvasContent && typeof window !== 'undefined' && window.innerWidth < 640) {
    return (
      <div className="flex h-full overflow-hidden min-h-0 relative">
        {chatColumn}
        <div className="absolute inset-0 z-30 flex flex-col overflow-hidden">
          <CanvasPanel content={canvasContent} title={canvasTitle} onClose={closeCanvas} />
        </div>
      </div>
    );
  }

  // Desktop: painéis redimensionáveis
  if (canvasContent) {
    return (
      <PanelGroup direction="horizontal" className="h-full" autoSaveId="chat-canvas-layout">
        <Panel defaultSize={40} minSize={25} maxSize={65} className="flex flex-col min-h-0">
          {chatColumn}
        </Panel>
        <PanelResizeHandle className="w-1 bg-border hover:bg-primary/40 transition-colors cursor-col-resize" />
        <Panel defaultSize={60} minSize={30} className="flex flex-col min-h-0 overflow-hidden">
          <CanvasPanel content={canvasContent} title={canvasTitle} onClose={closeCanvas} />
        </Panel>
      </PanelGroup>
    );
  }

  return (
    <div className="flex h-full overflow-hidden min-h-0">
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {chatColumn}
      </div>
    </div>
  );
}