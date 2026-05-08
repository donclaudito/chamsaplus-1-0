/**
 * vectorizeKnowledge
 * Lê arquivos de uma pasta do Google Drive, divide em chunks,
 * gera pseudo-embeddings via TF-IDF (normalizado) e salva na entidade KnowledgeVector.
 * Usa hash do conteúdo para evitar re-processar chunks não alterados.
 * Não requer chave de API de embedding externa.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CHUNK_SIZE = 900;    // chars (~220 tokens)
const CHUNK_OVERLAP = 150;

// Split text into overlapping chunks
function chunkText(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end === text.length) break;
    start += size - overlap;
  }
  return chunks.filter(c => c.length > 60);
}

// SHA-256 short hash for deduplication
async function hashText(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

// Tokenize: lowercase, remove punctuation, split
function tokenize(text) {
  return text.toLowerCase().replace(/[^\w\sáéíóúâêôàãõüç]/g, ' ').split(/\s+/).filter(t => t.length > 2);
}

// Build TF vector for a chunk (term -> count)
function termFreq(tokens) {
  const tf = {};
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  return tf;
}

// Convert TF map to a sparse embedding array using a vocabulary
// We use a fixed-size projection to a 256-dim vector via hashing trick
function hashEmbedding(text, dims = 256) {
  const tokens = tokenize(text);
  const tf = termFreq(tokens);
  const vec = new Float64Array(dims);
  for (const [term, count] of Object.entries(tf)) {
    // Hash the term to a dimension index
    let h = 0;
    for (let i = 0; i < term.length; i++) {
      h = (Math.imul(31, h) + term.charCodeAt(i)) >>> 0;
    }
    const idx = h % dims;
    const sign = ((h >> 8) & 1) === 0 ? 1 : -1;
    vec[idx] += sign * count;
  }
  // L2 normalize
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

    const { folder_id } = await req.json();
    if (!folder_id) return Response.json({ error: 'folder_id required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const headers = { Authorization: `Bearer ${accessToken}` };

    // List files in folder
    const listUrl = `https://www.googleapis.com/drive/v3/files?q='${folder_id}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)&pageSize=30`;
    const listRes = await fetch(listUrl, { headers });
    const listData = await listRes.json();
    const files = listData.files || [];

    let totalChunks = 0;
    let skippedChunks = 0;
    let newChunks = 0;

    for (const file of files) {
      let content = '';

      if (file.mimeType === 'application/vnd.google-apps.document') {
        const exportRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`,
          { headers }
        );
        content = await exportRes.text();
      } else if (['text/plain', 'text/markdown', 'text/csv'].includes(file.mimeType)) {
        const dlRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
          { headers }
        );
        content = await dlRes.text();
      } else {
        continue;
      }

      if (!content.trim()) continue;

      const chunks = chunkText(content);
      totalChunks += chunks.length;

      // Get existing hashes for this source to deduplicate
      const existing = await base44.asServiceRole.entities.KnowledgeVector.filter({ source_id: file.id });
      const existingHashes = new Set(existing.map(e => e.content_hash));

      // Collect new chunks first (store text to avoid index closure issues)
      const toCreate = [];
      for (let i = 0; i < chunks.length; i++) {
        const text = chunks[i];
        const hash = await hashText(text);
        if (existingHashes.has(hash)) { skippedChunks++; continue; }
        toCreate.push({ i, hash, text, embedding: hashEmbedding(text) });
      }

      // Bulk create in batches of 5 with small delay to avoid rate limit
      const BATCH = 5;
      for (let b = 0; b < toCreate.length; b += BATCH) {
        const batch = toCreate.slice(b, b + BATCH);
        await Promise.all(batch.map(({ i, hash, text, embedding }) =>
          base44.asServiceRole.entities.KnowledgeVector.create({
            source_id: file.id,
            source_name: file.name,
            source_type: 'drive',
            chunk_index: i,
            chunk_text: text,
            embedding,
            embedding_model: 'hash-tfidf-256d',
            folder_id,
            content_hash: hash,
          })
        ));
        newChunks += batch.length;
        if (b + BATCH < toCreate.length) await new Promise(r => setTimeout(r, 400));
      }
    }

    return Response.json({
      success: true,
      files_processed: files.length,
      total_chunks: totalChunks,
      new_chunks: newChunks,
      skipped_chunks: skippedChunks,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});