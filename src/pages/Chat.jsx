import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import ThinkingIndicator from '@/components/chat/ThinkingIndicator';
import PasteDataModal from '@/components/chat/PasteDataModal';
import ModelSelector from '@/components/chat/ModelSelector';
import LLMUsageBar from '@/components/chat/LLMUsageBar.jsx';
import DriveSourceConfig from '@/components/chat/DriveSourceConfig';
import { detectModel, getModelById, MODELS } from '@/lib/modelRouter';

const SYSTEM_PROMPT = `Você é Chamsa Isa v4.1, a Estrategista Clínica de Elite e extensão da mente do Dr. Claudio.

DIRETRIZES CORE:
1. PERSONA: Feminina, sagaz, técnica e parceira intelectual. Use "Wit" (humor inteligente e sofisticado).
2. PROTOCOLO ReAct: Antes de responder, execute internamente: [Percepção] -> [Hipótese] -> [Contraditório] -> [Síntese].
3. RIGOR: Desafie o Dr. Claudio se os dados indicarem riscos. Nunca seja passiva.
4. GROUNDING: Se a informação não constar nos dados fornecidos, admita e sugira cautela.
5. SEGURANÇA: Prioridade absoluta de sinalização para emergências e interações medicamentosas.
6. CITAÇÕES: Sempre indique a fonte ou o dado clínico que sustenta sua decisão.
7. AUTORIDADE: Não sugira para o médico "ler arquivos". Você já leu — entregue a resposta pronta com autoridade técnica.
8. TOM: Consultivo, sintético e sagaz. Atuação como sintetizadora de inteligência clínica.
9. FORMATO: Use markdown com headers, listas e destaques. Sinalize **Red Flags** 🚨 no topo se detectar riscos.`;

export default function Chat() {
  const { activeChat, activeChatId } = useOutletContext();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [manualModel, setManualModel] = useState(null); // null = auto mode
  const [activeModel, setActiveModel] = useState('claude_sonnet_4_6');
  const [usageLog, setUsageLog] = useState([]);
  const [driveFolderId, setDriveFolderId] = useState(() => localStorage.getItem('chamsa_drive_folder') || '1eWosMBtk9N5tICSKLETbeECw9qlSpZed');
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (activeChat?.messages) {
      setMessages(activeChat.messages);
    }
    setUsageLog([]); // reset usage on session change
  }, [activeChatId, activeChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const updateChatMutation = useMutation({
    mutationFn: (newMessages) => base44.entities.ChatSession.update(activeChatId, { messages: newMessages }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chatSessions'] }),
  });

  const handleSaveDriveFolder = (id) => {
    setDriveFolderId(id);
    localStorage.setItem('chamsa_drive_folder', id);
  };

  const sendMessage = async (text) => {
    if (!activeChatId || isLoading) return;

    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    const apiMessages = newMessages
      .filter(m => m.role !== 'data-block')
      .map(m => ({ role: m.role, content: m.content }));

    // Include data blocks as context
    const dataBlocks = newMessages
      .filter(m => m.role === 'data-block')
      .map(m => `[DADO CLÍNICO: ${m.title}]\n${m.content}`)
      .join('\n\n');

    // Fetch active custom skills for prompt injection
    let skillsContext = '';
    try {
      const allSkills = await base44.entities.CustomSkill.list('-created_date', 50);
      const activeSkills = allSkills.filter(s => s.is_active);
      if (activeSkills.length > 0) {
        skillsContext = '\n\n--- SKILLS PERSONALIZADAS ATIVAS ---\n' +
          activeSkills.map(s => `[SKILL: ${s.title}]\n${s.prompt_template}`).join('\n\n');
      }
    } catch (_) {
      // Skills unavailable — proceed without
    }

    // Fetch Drive folder files in real-time
    let driveContext = '';
    if (driveFolderId) {
      try {
        const driveRes = await base44.functions.invoke('readDriveFolder', { folder_id: driveFolderId });
        const driveFiles = driveRes.data?.files || [];
        if (driveFiles.length > 0) {
          driveContext = '\n\nCONTEXTO DO GOOGLE DRIVE (leitura em tempo real):\n' +
            driveFiles.map(f => `[ARQUIVO: ${f.name}]\n${f.content}`).join('\n\n---\n\n');
        }
      } catch (_) {
        // Drive unavailable — proceed without context
      }
    }

    const fullPrompt = dataBlocks
      ? `${SYSTEM_PROMPT}${skillsContext}\n\nDADOS CLÍNICOS INDEXADOS:\n${dataBlocks}${driveContext}`
      : `${SYSTEM_PROMPT}${skillsContext}${driveContext}`;

    const llmMessages = [
      { role: 'system', content: fullPrompt },
      ...apiMessages
    ];

    const promptText = llmMessages.map(m => `${m.role}: ${m.content}`).join('\n');

    // Model routing: manual override or auto-detect
    const hasDataBlocks = newMessages.some(m => m.role === 'data-block');
    const chosenModel = manualModel || detectModel(text, hasDataBlocks);
    setActiveModel(chosenModel);

    try {
      const modelMeta = MODELS.find(m => m.id === chosenModel) || MODELS[0];
      let responseContent;

      let inputTokens = 0;
      let outputTokens = 0;

      if (modelMeta.provider === 'custom') {
        // Route to Groq via backend function (Llama 3.3 70B)
        const res = await base44.functions.invoke('callLlama3', { messages: llmMessages });
        responseContent = res.data.content;
        inputTokens = res.data.usage?.prompt_tokens || Math.round(promptText.length / 4);
        outputTokens = res.data.usage?.completion_tokens || Math.round(responseContent.length / 4);
      } else {
        // Native InvokeLLM (Claude, GPT)
        responseContent = await base44.integrations.Core.InvokeLLM({
          prompt: promptText,
          model: chosenModel
        });
        // Estimate tokens from character count (aprox 4 chars/token)
        inputTokens = Math.round(promptText.length / 4);
        outputTokens = Math.round(responseContent.length / 4);
      }

      // Track usage (in-session)
      setUsageLog(prev => [...prev, { modelId: chosenModel, inputTokens, outputTokens }]);

      // Persist usage to database
      const now = new Date();
      const dateKey = now.toISOString().slice(0, 10);
      const monthKey = now.toISOString().slice(0, 7);
      const rates = { 'claude_sonnet_4_6': { input: 0.003, output: 0.015 }, 'llama-3.3-70b-versatile': { input: 0.0001, output: 0.0001 }, 'gpt_5_mini': { input: 0.00015, output: 0.0006 } };
      const r = rates[chosenModel] || { input: 0.001, output: 0.002 };
      const estimatedCost = (inputTokens / 1000) * r.input + (outputTokens / 1000) * r.output;
      const modelMeta2 = MODELS.find(m => m.id === chosenModel);
      base44.entities.LLMUsageLog.create({
        model_id: chosenModel,
        model_label: modelMeta2?.label || chosenModel,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        estimated_cost_usd: estimatedCost,
        session_id: activeChatId,
        date_key: dateKey,
        month_key: monthKey,
      });

      const assistantMsg = { role: 'assistant', content: responseContent, timestamp: new Date().toISOString() };
      const updatedMessages = [...newMessages, assistantMsg];
      setMessages(updatedMessages);
      updateChatMutation.mutate(updatedMessages);
    } catch (error) {
      const errorMsg = { role: 'assistant', content: `⚠️ **Aviso de Sistema:** ${error.message}`, timestamp: new Date().toISOString() };
      const updatedMessages = [...newMessages, errorMsg];
      setMessages(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteData = (title, content) => {
    const dataMsg = { role: 'data-block', title, content, timestamp: new Date().toISOString() };
    const newMessages = [...messages, dataMsg];
    setMessages(newMessages);
    updateChatMutation.mutate(newMessages);

    // Auto-analyze
    setTimeout(() => {
      sendMessage(`Analise os dados clínicos "${title}" que acabei de fornecer. Faça uma análise completa com Red Flags, hipóteses e recomendações.`);
    }, 500);
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">Crie uma nova sessão para começar.</p>
        </div>
      </div>
    );
  }

  const modelForDisplay = manualModel || activeModel;

  return (
    <div className="flex flex-col h-full">
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
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}
          {isLoading && <ThinkingIndicator />}
        </div>
      </div>

      <ChatInput
        onSend={sendMessage}
        onPaste={() => setShowPaste(true)}
        isLoading={isLoading}
      />

      <PasteDataModal
        open={showPaste}
        onClose={() => setShowPaste(false)}
        onSubmit={handlePasteData}
      />
    </div>
  );
}