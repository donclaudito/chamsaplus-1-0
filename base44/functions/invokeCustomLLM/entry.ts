import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PROVIDER_ENDPOINTS = {
  openai: 'https://api.openai.com/v1/chat/completions',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  mistral: 'https://api.mistral.ai/v1/chat/completions',
  together: 'https://api.together.xyz/v1/chat/completions',
  anthropic: null, // handled separately
  google: null,    // handled separately
};

async function callOpenAICompatible(endpoint, apiKey, messages, modelId, maxTokens, temperature) {
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelId, messages, max_tokens: maxTokens, temperature }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`API error (${resp.status}): ${err}`);
  }
  const data = await resp.json();
  return {
    content: data.choices[0].message.content,
    input_tokens: data.usage?.prompt_tokens || 0,
    output_tokens: data.usage?.completion_tokens || 0,
  };
}

async function callAnthropic(apiKey, messages, modelId, maxTokens, temperature) {
  const systemMsg = messages.find(m => m.role === 'system');
  const chatMsgs = messages.filter(m => m.role !== 'system');
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: maxTokens,
      temperature,
      system: systemMsg?.content || '',
      messages: chatMsgs,
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Anthropic error (${resp.status}): ${err}`);
  }
  const data = await resp.json();
  return {
    content: data.content[0].text,
    input_tokens: data.usage?.input_tokens || 0,
    output_tokens: data.usage?.output_tokens || 0,
  };
}

async function callGoogle(apiKey, messages, modelId, maxTokens, temperature) {
  const systemMsg = messages.find(m => m.role === 'system');
  const chatMsgs = messages.filter(m => m.role !== 'system').map(m => ({
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
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Google AI error (${resp.status}): ${err}`);
  }
  const data = await resp.json();
  return {
    content: data.candidates[0].content.parts[0].text,
    input_tokens: data.usageMetadata?.promptTokenCount || 0,
    output_tokens: data.usageMetadata?.candidatesTokenCount || 0,
  };
}

function parseResponse(raw) {
  let content = raw;
  let canvas = null;
  let searchPrompt = null;
  const canvasMatch = content.match(/<CANVAS[^>]*title\s*=\s*["'\u201c\u201d]([^"'\u201c\u201d\n]*)["'\u201c\u201d][^>]*>([\s\S]*?)<\/CANVAS>/i);
  if (canvasMatch) {
    canvas = { title: canvasMatch[1].trim(), content: canvasMatch[2].trim() };
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { messages } = await req.json();
    if (!messages?.length) return Response.json({ error: 'Mensagens inválidas' }, { status: 400 });

    // Find user's active LLM config
    const configs = await base44.entities.UserLLMConfig.filter({ created_by: user.email, is_active: true });
    if (!configs?.length) return Response.json({ error: 'Nenhuma configuração de LLM ativa encontrada' }, { status: 404 });

    const cfg = configs[0];
    const apiKey = cfg.api_key_encrypted; // stored directly (user's own key)
    const maxTokens = cfg.max_tokens || 2048;
    const temperature = cfg.temperature ?? 0.3;
    const modelId = cfg.model_id;
    const provider = cfg.provider;

    let result;
    if (provider === 'anthropic') {
      result = await callAnthropic(apiKey, messages, modelId, maxTokens, temperature);
    } else if (provider === 'google') {
      result = await callGoogle(apiKey, messages, modelId, maxTokens, temperature);
    } else {
      const baseUrl = cfg.base_url || PROVIDER_ENDPOINTS[provider];
      if (!baseUrl) return Response.json({ error: `Provedor "${provider}" não suportado` }, { status: 400 });
      result = await callOpenAICompatible(baseUrl, apiKey, messages, modelId, maxTokens, temperature);
    }

    const parsed = parseResponse(result.content);
    return Response.json({
      ...parsed,
      usage: { prompt_tokens: result.input_tokens, completion_tokens: result.output_tokens },
      provider,
      model: modelId,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});