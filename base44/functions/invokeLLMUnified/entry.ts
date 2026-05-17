/**
 * invokeLLMUnified
 * Ponto único de invocação de LLM para o frontend.
 * Resolve qual provedor usar (custom user config, Groq/Llama, ou Base44 nativo),
 * executa a chamada, faz o parsing de <CANVAS> e <SEARCH_PROMPT> e retorna
 * sempre um objeto estruturado: { content, canvas, searchPrompt, usage, provider, model }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Provider endpoints ──────────────────────────────────────────────────────
const PROVIDER_ENDPOINTS = {
  openai:      'https://api.openai.com/v1/chat/completions',
  groq:        'https://api.groq.com/openai/v1/chat/completions',
  mistral:     'https://api.mistral.ai/v1/chat/completions',
  together:    'https://api.together.xyz/v1/chat/completions',
  deepseek:    'https://api.deepseek.com/v1/chat/completions',
  xai:         'https://api.x.ai/v1/chat/completions',
  perplexity:  'https://api.perplexity.ai/chat/completions',
  anthropic:   null, // handled separately
  google:      null, // handled separately
  cohere:      null, // handled separately
  ollama:      null, // base_url is user-defined
};

// ── LLM callers ─────────────────────────────────────────────────────────────
async function callOpenAICompatible(endpoint, apiKey, messages, modelId, maxTokens, temperature) {
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelId, messages, max_tokens: maxTokens, temperature }),
  });
  if (!resp.ok) throw new Error(`API error (${resp.status}): ${await resp.text()}`);
  const data = await resp.json();
  if (!Array.isArray(data.choices) || !data.choices[0]?.message?.content) {
    throw new Error(`Resposta inesperada do provedor: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return {
    content: data.choices[0].message.content,
    input_tokens: data.usage?.prompt_tokens || 0,
    output_tokens: data.usage?.completion_tokens || 0,
  };
}

async function callAnthropic(apiKey, messages, modelId, maxTokens, temperature) {
  const systemMsg = messages.find(m => m.role === 'system');
  const chatMsgs  = messages.filter(m => m.role !== 'system');
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelId, max_tokens: maxTokens, temperature, system: systemMsg?.content || '', messages: chatMsgs }),
  });
  if (!resp.ok) throw new Error(`Anthropic error (${resp.status}): ${await resp.text()}`);
  const data = await resp.json();
  return {
    content: data.content[0].text,
    input_tokens: data.usage?.input_tokens || 0,
    output_tokens: data.usage?.output_tokens || 0,
  };
}

async function callGoogle(apiKey, messages, modelId, maxTokens, temperature) {
  const systemMsg = messages.find(m => m.role === 'system');
  const chatMsgs  = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
      contents: chatMsgs,
      generationConfig: { maxOutputTokens: maxTokens, temperature },
    }),
  });
  if (!resp.ok) throw new Error(`Google AI error (${resp.status}): ${await resp.text()}`);
  const data = await resp.json();
  return {
    content: data.candidates[0].content.parts[0].text,
    input_tokens: data.usageMetadata?.promptTokenCount || 0,
    output_tokens: data.usageMetadata?.candidatesTokenCount || 0,
  };
}

async function callCohere(apiKey, messages, modelId, maxTokens, temperature) {
  const systemMsg = messages.find(m => m.role === 'system');
  const chatMsgs  = messages.filter(m => m.role !== 'system');
  // Cohere uses a different format: preamble + chat_history + message
  const lastMsg   = chatMsgs[chatMsgs.length - 1];
  const history   = chatMsgs.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
    message: m.content,
  }));
  const resp = await fetch('https://api.cohere.com/v1/chat', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelId,
      message: lastMsg.content,
      chat_history: history,
      preamble: systemMsg?.content || '',
      max_tokens: maxTokens,
      temperature,
    }),
  });
  if (!resp.ok) throw new Error(`Cohere error (${resp.status}): ${await resp.text()}`);
  const data = await resp.json();
  return {
    content: data.text,
    input_tokens: data.meta?.tokens?.input_tokens || 0,
    output_tokens: data.meta?.tokens?.output_tokens || 0,
  };
}

async function callGroqLlama(messages, groqKey, maxTokens = 4096, temperature = 0.7) {
  return callOpenAICompatible(
    'https://api.groq.com/openai/v1/chat/completions',
    groqKey,
    messages,
    'llama-3.3-70b-versatile',
    maxTokens,
    temperature,
  );
}

// ── Tag parser ───────────────────────────────────────────────────────────────
function parseResponse(raw) {
  let content = raw;
  let canvas = null;
  let searchPrompt = null;

  const canvasMatch = content.match(
    /<CANVAS[^>]*title\s*=\s*["'\u201c\u201d]([^"'\u201c\u201d\n]*)["'\u201c\u201d][^>]*>([\s\S]*?)<\/CANVAS>/i
  );
  if (canvasMatch) {
    canvas  = { title: canvasMatch[1].trim(), content: canvasMatch[2].trim() };
    content = content.replace(/<CANVAS[\s\S]*?<\/CANVAS>/gi, '').trim();
    if (!content) content = `📄 O documento **"${canvas.title}"** foi gerado e está disponível no painel lateral.`;
  }

  const searchMatch = content.match(/<SEARCH_PROMPT>([\s\S]*?)<\/SEARCH_PROMPT>/);
  if (searchMatch) {
    searchPrompt = searchMatch[1].trim();
    content = content.replace(/<SEARCH_PROMPT>[\s\S]*?<\/SEARCH_PROMPT>/g, '').trim();
  }

  return { content, canvas, searchPrompt };
}

// ── Handler ──────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user   = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages, model: requestedModel } = await req.json();
    if (!messages?.length) return Response.json({ error: 'messages required' }, { status: 400 });

    let raw;
    let provider = 'native';
    let modelId  = requestedModel || 'gpt_5_mini';
    let inputTokens  = 0;
    let outputTokens = 0;

    // 1. Verificar se o usuário tem LLM customizado ativo com chave válida
    const configs = await base44.entities.UserLLMConfig.filter({ created_by: user.email, is_active: true });
    const userCfg = configs?.find(c => c.api_key_encrypted && c.api_key_encrypted.trim().length > 0 && !c.api_key_encrypted.includes('••••'));

    if (userCfg) {
      const apiKey     = userCfg.api_key_encrypted;
      const maxTokens  = userCfg.max_tokens || 2048;
      const temperature = userCfg.temperature ?? 0.3;
      modelId  = userCfg.model_id;
      provider = userCfg.provider;

      let result;
      if (provider === 'anthropic') {
        result = await callAnthropic(apiKey, messages, modelId, maxTokens, temperature);
      } else if (provider === 'google') {
        result = await callGoogle(apiKey, messages, modelId, maxTokens, temperature);
      } else if (provider === 'cohere') {
        result = await callCohere(apiKey, messages, modelId, maxTokens, temperature);
      } else {
        const endpoint = userCfg.base_url || PROVIDER_ENDPOINTS[provider];
        if (!endpoint) return Response.json({ error: `Provedor "${provider}" não suportado. Informe a Base URL manualmente.` }, { status: 400 });
        result = await callOpenAICompatible(endpoint, apiKey, messages, modelId, maxTokens, temperature);
      }
      raw          = result.content;
      inputTokens  = result.input_tokens;
      outputTokens = result.output_tokens;

    // 2. Fallback para chaves padrão do Administrador (Deno.env)
    } else {
      const getEnvKey = (name) => Deno.env.get(`ADMIN_${name}_API_KEY`) || Deno.env.get(`${name}_API_KEY`);
      const groqKey       = getEnvKey('GROQ');
      const mistralKey    = getEnvKey('MISTRAL');
      const openaiKey     = getEnvKey('OPENAI');
      const geminiKey     = getEnvKey('GOOGLE') || getEnvKey('GEMINI');
      const anthropicKey  = getEnvKey('ANTHROPIC');
      const deepseekKey   = getEnvKey('DEEPSEEK');
      const xaiKey        = getEnvKey('XAI');
      const perplexityKey = getEnvKey('PERPLEXITY');
      const cohereKey     = getEnvKey('COHERE');

      let fallbackProvider = null;
      let fallbackKey      = null;
      let fallbackModel    = requestedModel || 'gpt-4o-mini';
      let fallbackEndpoint = null;

      if (requestedModel.includes('llama') || requestedModel.includes('mixtral') || requestedModel.includes('gemma')) {
        fallbackKey = groqKey || mistralKey || openaiKey || geminiKey;
        if (fallbackKey === groqKey && groqKey) { fallbackProvider = 'groq'; fallbackEndpoint = PROVIDER_ENDPOINTS.groq; fallbackModel = 'llama-3.3-70b-versatile'; }
        else if (fallbackKey === mistralKey && mistralKey) { fallbackProvider = 'mistral'; fallbackEndpoint = PROVIDER_ENDPOINTS.mistral; fallbackModel = 'mistral-large-latest'; }
        else if (fallbackKey === openaiKey && openaiKey) { fallbackProvider = 'openai'; fallbackEndpoint = PROVIDER_ENDPOINTS.openai; fallbackModel = 'gpt-4o'; }
        else if (fallbackKey === geminiKey && geminiKey) { fallbackProvider = 'google'; fallbackModel = 'gemini-1.5-pro'; }
      } else if (requestedModel.includes('mistral') || requestedModel.includes('codestral')) {
        fallbackKey = mistralKey || groqKey || openaiKey || geminiKey;
        if (fallbackKey === mistralKey && mistralKey) { fallbackProvider = 'mistral'; fallbackEndpoint = PROVIDER_ENDPOINTS.mistral; }
        else if (fallbackKey === groqKey && groqKey) { fallbackProvider = 'groq'; fallbackEndpoint = PROVIDER_ENDPOINTS.groq; fallbackModel = 'llama-3.3-70b-versatile'; }
        else if (fallbackKey === openaiKey && openaiKey) { fallbackProvider = 'openai'; fallbackEndpoint = PROVIDER_ENDPOINTS.openai; fallbackModel = 'gpt-4o'; }
        else if (fallbackKey === geminiKey && geminiKey) { fallbackProvider = 'google'; fallbackModel = 'gemini-1.5-pro'; }
      } else if (requestedModel.includes('gpt') || requestedModel.includes('o1') || requestedModel.includes('o3') || requestedModel.includes('mini')) {
        fallbackKey = openaiKey || mistralKey || groqKey || geminiKey;
        if (fallbackKey === openaiKey && openaiKey) { fallbackProvider = 'openai'; fallbackEndpoint = PROVIDER_ENDPOINTS.openai; fallbackModel = requestedModel === 'gpt_5_mini' ? 'gpt-4o-mini' : requestedModel; }
        else if (fallbackKey === mistralKey && mistralKey) { fallbackProvider = 'mistral'; fallbackEndpoint = PROVIDER_ENDPOINTS.mistral; fallbackModel = 'mistral-small-latest'; }
        else if (fallbackKey === groqKey && groqKey) { fallbackProvider = 'groq'; fallbackEndpoint = PROVIDER_ENDPOINTS.groq; fallbackModel = 'llama-3.3-70b-versatile'; }
        else if (fallbackKey === geminiKey && geminiKey) { fallbackProvider = 'google'; fallbackModel = 'gemini-1.5-flash'; }
      } else if (requestedModel.includes('claude')) {
        fallbackKey = anthropicKey || mistralKey || groqKey || openaiKey || geminiKey;
        if (fallbackKey === anthropicKey && anthropicKey) { fallbackProvider = 'anthropic'; fallbackModel = requestedModel === 'claude_sonnet_4_6' ? 'claude-3-5-sonnet-latest' : requestedModel; }
        else if (fallbackKey === mistralKey && mistralKey) { fallbackProvider = 'mistral'; fallbackEndpoint = PROVIDER_ENDPOINTS.mistral; fallbackModel = 'mistral-large-latest'; }
        else if (fallbackKey === groqKey && groqKey) { fallbackProvider = 'groq'; fallbackEndpoint = PROVIDER_ENDPOINTS.groq; fallbackModel = 'llama-3.3-70b-versatile'; }
        else if (fallbackKey === openaiKey && openaiKey) { fallbackProvider = 'openai'; fallbackEndpoint = PROVIDER_ENDPOINTS.openai; fallbackModel = 'gpt-4o'; }
        else if (fallbackKey === geminiKey && geminiKey) { fallbackProvider = 'google'; fallbackModel = 'gemini-1.5-pro'; }
      } else if (requestedModel.includes('deepseek')) {
        fallbackKey = deepseekKey || groqKey || openaiKey || mistralKey;
        if (fallbackKey === deepseekKey && deepseekKey) { fallbackProvider = 'deepseek'; fallbackEndpoint = PROVIDER_ENDPOINTS.deepseek; }
        else if (fallbackKey === groqKey && groqKey) { fallbackProvider = 'groq'; fallbackEndpoint = PROVIDER_ENDPOINTS.groq; fallbackModel = 'deepseek-r1-distill-llama-70b'; }
        else if (fallbackKey === openaiKey && openaiKey) { fallbackProvider = 'openai'; fallbackEndpoint = PROVIDER_ENDPOINTS.openai; fallbackModel = 'gpt-4o'; }
      } else if (requestedModel.includes('grok') || requestedModel.includes('xai')) {
        fallbackKey = xaiKey || openaiKey || groqKey;
        if (fallbackKey === xaiKey && xaiKey) { fallbackProvider = 'xai'; fallbackEndpoint = PROVIDER_ENDPOINTS.xai; }
        else if (fallbackKey === openaiKey && openaiKey) { fallbackProvider = 'openai'; fallbackEndpoint = PROVIDER_ENDPOINTS.openai; fallbackModel = 'gpt-4o'; }
      } else if (requestedModel.includes('sonar') || requestedModel.includes('perplexity')) {
        fallbackKey = perplexityKey || openaiKey || groqKey;
        if (fallbackKey === perplexityKey && perplexityKey) { fallbackProvider = 'perplexity'; fallbackEndpoint = PROVIDER_ENDPOINTS.perplexity; }
        else if (fallbackKey === openaiKey && openaiKey) { fallbackProvider = 'openai'; fallbackEndpoint = PROVIDER_ENDPOINTS.openai; fallbackModel = 'gpt-4o'; }
      } else if (requestedModel.includes('command') || requestedModel.includes('cohere')) {
        fallbackKey = cohereKey || openaiKey || groqKey;
        if (fallbackKey === cohereKey && cohereKey) { fallbackProvider = 'cohere'; }
        else if (fallbackKey === openaiKey && openaiKey) { fallbackProvider = 'openai'; fallbackEndpoint = PROVIDER_ENDPOINTS.openai; fallbackModel = 'gpt-4o'; }
      }

      // Se nenhum específico casou, pega a primeira chave de admin disponível
      if (!fallbackKey) {
        fallbackKey = openaiKey || groqKey || mistralKey || geminiKey || anthropicKey || deepseekKey || xaiKey || perplexityKey || cohereKey;
        if (fallbackKey === openaiKey && openaiKey) { fallbackProvider = 'openai'; fallbackEndpoint = PROVIDER_ENDPOINTS.openai; fallbackModel = 'gpt-4o-mini'; }
        else if (fallbackKey === groqKey && groqKey) { fallbackProvider = 'groq'; fallbackEndpoint = PROVIDER_ENDPOINTS.groq; fallbackModel = 'llama-3.3-70b-versatile'; }
        else if (fallbackKey === mistralKey && mistralKey) { fallbackProvider = 'mistral'; fallbackEndpoint = PROVIDER_ENDPOINTS.mistral; fallbackModel = 'mistral-small-latest'; }
        else if (fallbackKey === geminiKey && geminiKey) { fallbackProvider = 'google'; fallbackModel = 'gemini-1.5-flash'; }
        else if (fallbackKey === anthropicKey && anthropicKey) { fallbackProvider = 'anthropic'; fallbackModel = 'claude-3-5-sonnet-latest'; }
        else if (fallbackKey === deepseekKey && deepseekKey) { fallbackProvider = 'deepseek'; fallbackEndpoint = PROVIDER_ENDPOINTS.deepseek; fallbackModel = 'deepseek-chat'; }
        else if (fallbackKey === xaiKey && xaiKey) { fallbackProvider = 'xai'; fallbackEndpoint = PROVIDER_ENDPOINTS.xai; fallbackModel = 'grok-2-1212'; }
        else if (fallbackKey === perplexityKey && perplexityKey) { fallbackProvider = 'perplexity'; fallbackEndpoint = PROVIDER_ENDPOINTS.perplexity; fallbackModel = 'sonar'; }
        else if (fallbackKey === cohereKey && cohereKey) { fallbackProvider = 'cohere'; fallbackModel = 'command-r-08-2024'; }
      }

      if (fallbackKey && fallbackProvider) {
        let result;
        if (fallbackProvider === 'anthropic') {
          result = await callAnthropic(fallbackKey, messages, fallbackModel, 2048, 0.3);
        } else if (fallbackProvider === 'google') {
          result = await callGoogle(fallbackKey, messages, fallbackModel, 2048, 0.3);
        } else if (fallbackProvider === 'cohere') {
          result = await callCohere(fallbackKey, messages, fallbackModel, 2048, 0.3);
        } else {
          result = await callOpenAICompatible(fallbackEndpoint, fallbackKey, messages, fallbackModel, 2048, 0.3);
        }
        raw          = result.content;
        inputTokens  = result.input_tokens;
        outputTokens = result.output_tokens;
        provider     = `admin-${fallbackProvider}`;
        modelId      = fallbackModel;

      // 3. Fallback final para InvokeLLM nativo da Base44
      } else {
        const promptText = messages.map(m => `${m.role}: ${m.content}`).join('\n');
        raw = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: promptText,
          model: requestedModel,
        });
        inputTokens  = Math.round(promptText.length / 4);
        outputTokens = Math.round(raw.length / 4);
        provider     = 'base44';
        modelId      = requestedModel;
      }
    }

    const parsed = parseResponse(raw);

    // Se o LLM gerou um SEARCH_PROMPT, executar busca no PubMed automaticamente
    let pubmedResults = null;
    if (parsed.searchPrompt) {
      try {
        const pubmedRes = await base44.functions.invoke('searchPubMed', { query: parsed.searchPrompt });
        if (pubmedRes?.articles?.length > 0) {
          pubmedResults = { articles: pubmedRes.articles, total: pubmedRes.total, query: parsed.searchPrompt };
        }
      } catch (_) {}
    }

    return Response.json({
      ...parsed,
      pubmedResults,
      usage: { prompt_tokens: inputTokens, completion_tokens: outputTokens },
      provider,
      model: modelId,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});