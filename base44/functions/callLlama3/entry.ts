/**
 * callLlama3
 * Proxy para o modelo Llama 3.3-70b via Groq API.
 * Faz o parsing das tags especiais <CANVAS> e <SEARCH_PROMPT> no backend,
 * retornando um objeto estruturado ao frontend.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function parseResponse(raw) {
  let content = raw;
  let canvas = null;
  let searchPrompt = null;

  // Extract <CANVAS title="...">...</CANVAS>
  const canvasMatch = content.match(/<CANVAS[^>]*title\s*=\s*["'\u201c\u201d]([^"'\u201c\u201d\n]*)["'\u201c\u201d][^>]*>([\s\S]*?)<\/CANVAS>/i);
  if (canvasMatch) {
    canvas = { title: canvasMatch[1].trim(), content: canvasMatch[2].trim() };
    content = content.replace(/<CANVAS[\s\S]*?<\/CANVAS>/gi, '').trim();
    if (!content) {
      content = `📄 O documento **"${canvas.title}"** foi gerado e está disponível no painel lateral.`;
    }
  }

  // Extract <SEARCH_PROMPT>...</SEARCH_PROMPT>
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
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages } = await req.json();
    if (!messages?.length) return Response.json({ error: 'messages required' }, { status: 400 });

    const groqKey = Deno.env.get('GROQ_API_KEY');
    if (!groqKey) return Response.json({ error: 'GROQ_API_KEY not set' }, { status: 500 });

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    const data = await groqResponse.json();
    if (!groqResponse.ok) {
      return Response.json({ error: data.error?.message || 'Groq API error' }, { status: 500 });
    }

    if (!Array.isArray(data.choices) || !data.choices[0]?.message?.content) {
      return Response.json({ error: 'Resposta inesperada da Groq API' }, { status: 500 });
    }

    const raw = data.choices[0].message.content;
    const parsed = parseResponse(raw);

    return Response.json({
      ...parsed,
      usage: {
        prompt_tokens: data.usage?.prompt_tokens || 0,
        completion_tokens: data.usage?.completion_tokens || 0,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});