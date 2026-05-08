/**
 * semanticSearch
 * Recebe uma query, gera hash-embedding via hashing trick (256d),
 * e retorna os top-K chunks mais relevantes usando similaridade de cosseno.
 * Compatível com vetores gerados por vectorizeKnowledge.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Cosine similarity between two float arrays
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

function tokenize(text) {
  return text.toLowerCase().replace(/[^\w\sáéíóúâêôàãõüç]/g, ' ').split(/\s+/).filter(t => t.length > 2);
}

function termFreq(tokens) {
  const tf = {};
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  return tf;
}

function hashEmbedding(text, dims = 256) {
  const tokens = tokenize(text);
  const tf = termFreq(tokens);
  const vec = new Float64Array(dims);
  for (const [term, count] of Object.entries(tf)) {
    let h = 0;
    for (let i = 0; i < term.length; i++) {
      h = (Math.imul(31, h) + term.charCodeAt(i)) >>> 0;
    }
    const idx = h % dims;
    const sign = ((h >> 8) & 1) === 0 ? 1 : -1;
    vec[idx] += sign * count;
  }
  let norm = 0;
  for (let i = 0; i < dims; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < dims; i++) vec[i] /= norm;
  return Array.from(vec);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query, folder_id, top_k = 5 } = await req.json();
    if (!query) return Response.json({ error: 'query required' }, { status: 400 });

    const queryEmbedding = hashEmbedding(query);

    // Fetch stored vectors (filter by folder if provided)
    const filter = folder_id ? { folder_id } : {};
    const vectors = await base44.asServiceRole.entities.KnowledgeVector.filter(filter, '-created_date', 500);

    if (!vectors || vectors.length === 0) {
      return Response.json({ chunks: [], message: 'No vectors indexed yet. Run vectorizeKnowledge first.' });
    }

    // Compute cosine similarity
    const scored = vectors.map(v => ({
      source_name: v.source_name,
      chunk_text: v.chunk_text,
      score: cosineSimilarity(queryEmbedding, v.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    const topChunks = scored.slice(0, top_k);

    return Response.json({ chunks: topChunks });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});