/**
 * semanticSearch
 * Gera embedding real da query via Groq (nomic-embed-text),
 * e retorna os top-K chunks mais relevantes usando similaridade de cosseno.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GROQ_EMBED_MODEL = 'nomic-embed-text-v1_5';

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
  const resp = await fetch('https://api.groq.com/openai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: GROQ_EMBED_MODEL, input: [text] }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Groq embeddings error: ${err}`);
  }
  const data = await resp.json();
  return data.data[0].embedding;
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

    const queryEmbedding = await getQueryEmbedding(query, groqKey);

    // Fetch vectors — only those generated with real embeddings
    const filter = folder_id ? { folder_id, embedding_model: GROQ_EMBED_MODEL } : { embedding_model: GROQ_EMBED_MODEL };
    const vectors = await base44.asServiceRole.entities.KnowledgeVector.filter(filter, '-created_date', 1000);

    if (!vectors || vectors.length === 0) {
      return Response.json({ chunks: [], message: 'No vectors indexed yet. Run vectorizeKnowledge first.' });
    }

    // Score and rank
    const scored = vectors
      .map(v => ({
        source_name: v.source_name,
        chunk_text: v.chunk_text,
        score: cosineSimilarity(queryEmbedding, v.embedding),
      }))
      .filter(v => v.score >= min_score)
      .sort((a, b) => b.score - a.score)
      .slice(0, top_k);

    return Response.json({ chunks: scored });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});