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
import CanvasPanel from '@/components/chat/CanvasPanel';
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
9. FORMATO: Use markdown com headers, listas e destaques. Sinalize **Red Flags** 🚨 no topo se detectar riscos.
10. PESQUISA EXTERNA: Se a informação solicitada NÃO estiver disponível em seus dados ou contexto, admita brevemente e gere UMA string de pesquisa otimizada delimitada por <SEARCH_PROMPT>query aqui</SEARCH_PROMPT>. Exemplo: "Não possuo esses dados. <SEARCH_PROMPT>tratamento cirúrgico colecistite aguda guidelines 2024</SEARCH_PROMPT>"
11. CANVAS OBRIGATÓRIO: Sempre que produzir conteúdo extenso (mais de 300 palavras, ou relatório, protocolo, tabela, resumo de laudo, prescrição, orientação detalhada), você DEVE obrigatoriamente envolver o conteúdo completo na tag exata: <CANVAS title="Título Descritivo">conteúdo markdown completo aqui</CANVAS> — use exatamente aspas retas (") e a tag exatamente como mostrado. O painel lateral abrirá automaticamente. No corpo do chat coloque APENAS um parágrafo resumido do que foi gerado no canvas.`;

export default function Chat() {
  const { activeChat, activeChatId } = useOutletContext();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [manualModel, setManualModel] = useState(null); // null = auto mode
  const [activeModel, setActiveModel] = useState('claude_sonnet_4_6');
  const [usageLog, setUsageLog] = useState([]);
  const [driveFolderId, setDriveFolderId] = useState(() => localStorage.getItem('chamsa_drive_folder') || '1eWosMBtk9N5tICSKLETbeECw9qlSpZed');
  const [canvasContent, setCanvasContent] = useState(null);
  const [canvasTitle, setCanvasTitle] = useState(null);
  const [activeLLMBadge, setActiveLLMBadge] = useState(null); // { label, modelId, provider }
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  const PROVIDER_LABELS = { openai: 'OpenAI', anthropic: 'Anthropic', groq: 'Groq', google: 'Google AI', mistral: 'Mistral AI', together: 'Together AI' };

  useEffect(() => {
    if (activeChat?.messages) {
      setMessages(activeChat.messages);
    }
    setUsageLog([]); // reset usage on session change
  }, [activeChatId, activeChat]);

  // Show badge immediately based on active custom LLM config
  useEffect(() => {
    base44.entities.UserLLMConfig.filter({ is_active: true }).then((configs) => {
      if (configs?.length > 0) {
        const cfg = configs[0];
        setActiveLLMBadge({
          label: PROVIDER_LABELS[cfg.provider] || cfg.provider,
          modelId: cfg.model_id,
          provider: cfg.provider,
        });
      } else {
        setActiveLLMBadge(null);
      }
    }).catch(() => setActiveLLMBadge(null));
  }, []);

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

    // Update session title with the first user message snippet
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

    // RAG: Semantic search — retrieve only relevant chunks instead of full dump
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
      } catch (_) {
        // RAG unavailable — fallback silently
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

    // Model routing: manual override or auto-detect (RAG-aware)
    const hasDataBlocks = newMessages.some(m => m.role === 'data-block');
    const chosenModel = manualModel || detectModel(text, hasDataBlocks, hasVectorContext);
    setActiveModel(chosenModel);

    try {
      const modelMeta = MODELS.find(m => m.id === chosenModel) || MODELS[0];
      let responseContent;

      let inputTokens = 0;
      let outputTokens = 0;

      // Check if user has their own active LLM config
      let userHasCustomLLM = false;
      let activeUserConfig = null;
      try {
        const userConfigs = await base44.entities.UserLLMConfig.filter({ is_active: true });
        if (userConfigs?.length > 0) {
          userHasCustomLLM = true;
          activeUserConfig = userConfigs[0];
        }
      } catch (_) {}

      if (userHasCustomLLM && activeUserConfig) {
        // Use user's own API key via backend function
        const res = await base44.functions.invoke('invokeCustomLLM', { messages: llmMessages });
        responseContent = res.data.content;
        inputTokens = res.data.usage?.prompt_tokens || Math.round(promptText.length / 4);
        outputTokens = res.data.usage?.completion_tokens || Math.round(responseContent.length / 4);
        // Set badge for custom LLM
        const PROVIDER_LABELS = { openai: 'OpenAI', anthropic: 'Anthropic', groq: 'Groq', google: 'Google AI', mistral: 'Mistral AI', together: 'Together AI' };
        setActiveLLMBadge({
          label: PROVIDER_LABELS[activeUserConfig.provider] || activeUserConfig.provider,
          modelId: activeUserConfig.model_id,
          provider: activeUserConfig.provider,
        });
      } else if (modelMeta.provider === 'custom') {
        // Route to Groq via backend function (Llama 3.3 70B)
        const res = await base44.functions.invoke('callLlama3', { messages: llmMessages });
        responseContent = res.data.content;
        inputTokens = res.data.usage?.prompt_tokens || Math.round(promptText.length / 4);
        outputTokens = res.data.usage?.completion_tokens || Math.round(responseContent.length / 4);
        setActiveLLMBadge(null);
      } else {
        // Native InvokeLLM (Claude, GPT)
        responseContent = await base44.integrations.Core.InvokeLLM({
          prompt: promptText,
          model: chosenModel
        });
        inputTokens = Math.round(promptText.length / 4);
        outputTokens = Math.round(responseContent.length / 4);
        setActiveLLMBadge(null); // modelo nativo, sem badge custom
      }

      // Extract canvas content if present — support straight and curly quotes
      const canvasMatch = responseContent.match(/<CANVAS\s+title=[""\u201c\u201d]([^""\u201c\u201d]*)[""\u201c\u201d]>([\s\S]*?)<\/CANVAS>/i);
      if (canvasMatch) {
        setCanvasTitle(canvasMatch[1].trim());
        setCanvasContent(canvasMatch[2].trim());
        responseContent = responseContent.replace(/<CANVAS\s+title=[""\u201c\u201d][^""\u201c\u201d]*[""\u201c\u201d]>[\s\S]*?<\/CANVAS>/gi, '').trim();
      }

      // Extract search prompt suggestion if present
      let extractedSearchPrompt = null;
      const searchMatch = responseContent.match(/<SEARCH_PROMPT>([\s\S]*?)<\/SEARCH_PROMPT>/);
      if (searchMatch?.[1]) {
        extractedSearchPrompt = searchMatch[1].trim();
        responseContent = responseContent.replace(/<SEARCH_PROMPT>[\s\S]*?<\/SEARCH_PROMPT>/g, '').trim();
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

      const assistantMsg = { role: 'assistant', content: responseContent, timestamp: new Date().toISOString(), searchPrompt: extractedSearchPrompt };
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
    <div className="flex h-full overflow-hidden">
      {/* Main Chat Column */}
      <div className="flex flex-col flex-1 min-w-0">
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

      {/* Canvas Panel */}
      {canvasContent && (
        <div className="w-[420px] shrink-0 hidden md:flex flex-col border-l border-border">
          <CanvasPanel
            content={canvasContent}
            title={canvasTitle}
            onClose={() => { setCanvasContent(null); setCanvasTitle(null); }}
          />
        </div>
      )}
    </div>
  );
}