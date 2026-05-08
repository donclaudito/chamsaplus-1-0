/**
 * vectorizeKnowledge
 * Lê arquivos de uma pasta do Google Drive (com paginação),
 * divide em chunks, gera pseudo-embeddings e salva na entidade KnowledgeVector.
 * Usa hash do conteúdo para evitar re-processar chunks não alterados.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 150;
const PAGE_SIZE = 50; // paginação Drive

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

async function hashText(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
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

// Fetch ALL files in a folder with pagination
async function listAllFiles(folder_id, headers) {
  const files = [];
  let pageToken = null;
  do {
    const pageParam = pageToken ? `&pageToken=${pageToken}` : '';
    const url = `https://www.googleapis.com/drive/v3/files?q='${folder_id}'+in+parents+and+trashed=false&fields=files(id,name,mimeType),nextPageToken&pageSize=${PAGE_SIZE}${pageParam}`;
    const res = await fetch(url, { headers });
    const data = await res.json();
    if (data.files) files.push(...data.files);
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return files;
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

    // List ALL files with pagination
    const files = await listAllFiles(folder_id, headers);

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

      const existing = await base44.asServiceRole.entities.KnowledgeVector.filter({ source_id: file.id });
      const existingHashes = new Set(existing.map(e => e.content_hash));

      const toCreate = [];
      for (let i = 0; i < chunks.length; i++) {
        const text = chunks[i];
        const hash = await hashText(text);
        if (existingHashes.has(hash)) { skippedChunks++; continue; }
        toCreate.push({ i, hash, text, embedding: hashEmbedding(text) });
      }

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