/**
 * semanticSearch
 * Busca chunks relevantes na base de conhecimento.
 * Usa embeddings via Groq (se disponível) ou busca por palavras-chave como fallback.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Modelos de embedding Groq — testa em ordem até encontrar um funcionando
const GROQ_EMBED_MODELS = [
  'nomic-embed-text-v1.5',
  'nomic-embed-text-v1_5',
  'text-embedding-ada-002',
];

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getQueryEmbedding(text, groqKey) {
  let lastError = null;
  for (const model of GROQ_EMBED_MODELS) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, input: [text] }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return { embedding: data.data[0].embedding, model };
      }
      lastError = `Model ${model} failed with status ${resp.status}`;
    } catch (err) {
      lastError = err.message;
    }
  }
  console.warn(`[semanticSearch] Embedding indisponível: ${lastError}`);
  return null;
}

// Fallback: busca por relevância de palavras-chave (TF-like)
function keywordScore(query, text) {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const textLower = text.toLowerCase();
  let score = 0;
  for (const word of queryWords) {
    const count = (textLower.match(new RegExp(word, 'g')) || []).length;
    if (count > 0) score += 1 + Math.log(count);
  }
  return queryWords.length > 0 ? score / queryWords.length : 0;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query, folder_id, top_k = 6, min_score = 0.3 } = await req.json();
    if (!query) return Response.json({ error: 'query required' }, { status: 400 });

    const groqKey = Deno.env.get('GROQ_API_KEY');
    if (!groqKey) return Response.json({ error: 'GROQ_API_KEY not set' }, { status: 500 });

    // Tentar embedding vetorial
    const embeddingResult = await getQueryEmbedding(query, groqKey);

    let chunks = [];

    if (embeddingResult) {
      // Modo vetorial
      const { embedding: queryEmbedding, model: usedModel } = embeddingResult;
      const filter = folder_id
        ? { folder_id, embedding_model: usedModel }
        : { embedding_model: usedModel };
      const vectors = await base44.asServiceRole.entities.KnowledgeVector.filter(filter, '-created_date', 1000);

      if (vectors && vectors.length > 0) {
        chunks = vectors
          .map(v => ({
            source_name: v.source_name,
            chunk_text: v.chunk_text,
            score: cosineSimilarity(queryEmbedding, v.embedding),
          }))
          .filter(v => v.score >= min_score)
          .sort((a, b) => b.score - a.score)
          .slice(0, top_k);
      }
    }

    // Fallback por palavras-chave se não há resultado vetorial
    if (chunks.length === 0) {
      const filter = folder_id ? { folder_id } : {};
      const vectors = await base44.asServiceRole.entities.KnowledgeVector.filter(filter, '-created_date', 1000);

      if (vectors && vectors.length > 0) {
        const MAX_KW_SCORE = 3.0;
        chunks = vectors
          .map(v => ({
            source_name: v.source_name,
            chunk_text: v.chunk_text,
            score: Math.min(keywordScore(query, v.chunk_text) / MAX_KW_SCORE, 1.0),
          }))
          .filter(v => v.score > 0.1)
          .sort((a, b) => b.score - a.score)
          .slice(0, top_k);
      }
    }

    return Response.json({ chunks });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});