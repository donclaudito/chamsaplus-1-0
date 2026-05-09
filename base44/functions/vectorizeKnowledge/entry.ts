/**
 * vectorizeKnowledge
 * Lê arquivos de uma pasta do Google Drive (com paginação),
 * divide em chunks, gera embeddings reais via Groq (nomic-embed-text)
 * e salva na entidade KnowledgeVector com deduplicação por hash SHA-256.
 * Restrito a usuários admin.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;
const PAGE_SIZE = 50;
const GROQ_EMBED_MODEL = 'nomic-embed-text-v1.5';

function chunkText(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end === text.length) break;
    start += size - overlap;
  }
  return chunks.filter(c => c.length > 80);
}

async function hashText(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

async function getEmbeddings(texts, groqKey) {
  const resp = await fetch('https://api.groq.com/openai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: GROQ_EMBED_MODEL, input: texts }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Groq embeddings error: ${err}`);
  }
  const data = await resp.json();
  return data.data.map(d => d.embedding);
}

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
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });

    const { folder_id } = await req.json();
    if (!folder_id) return Response.json({ error: 'folder_id required' }, { status: 400 });

    const groqKey = Deno.env.get('GROQ_API_KEY');
    if (!groqKey) return Response.json({ error: 'GROQ_API_KEY not set' }, { status: 500 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const driveHeaders = { Authorization: `Bearer ${accessToken}` };

    const files = await listAllFiles(folder_id, driveHeaders);
    let totalChunks = 0, skippedChunks = 0, newChunks = 0;

    for (const file of files) {
      let content = '';

      if (file.mimeType === 'application/vnd.google-apps.document') {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`,
          { headers: driveHeaders }
        );
        content = await res.text();
      } else if (['text/plain', 'text/markdown', 'text/csv'].includes(file.mimeType)) {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
          { headers: driveHeaders }
        );
        content = await res.text();
      } else {
        continue;
      }

      if (!content.trim()) continue;

      const chunks = chunkText(content);
      totalChunks += chunks.length;

      const existing = await base44.asServiceRole.entities.KnowledgeVector.filter({ source_id: file.id });
      const existingHashes = new Set(existing.map(e => e.content_hash));

      // Filter only new chunks
      const toProcess = [];
      for (let i = 0; i < chunks.length; i++) {
        const hash = await hashText(chunks[i]);
        if (existingHashes.has(hash)) { skippedChunks++; continue; }
        toProcess.push({ idx: i, text: chunks[i], hash });
      }

      if (toProcess.length === 0) continue;

      // Generate embeddings in batches of 20
      const EMBED_BATCH = 20;
      for (let b = 0; b < toProcess.length; b += EMBED_BATCH) {
        const batch = toProcess.slice(b, b + EMBED_BATCH);
        const embeddings = await getEmbeddings(batch.map(c => c.text), groqKey);

        const SAVE_BATCH = 5;
        for (let s = 0; s < batch.length; s += SAVE_BATCH) {
          const saveBatch = batch.slice(s, s + SAVE_BATCH);
          await Promise.all(saveBatch.map((chunk, j) =>
            base44.asServiceRole.entities.KnowledgeVector.create({
              source_id: file.id,
              source_name: file.name,
              source_type: 'drive',
              chunk_index: chunk.idx,
              chunk_text: chunk.text,
              embedding: embeddings[s + j],
              embedding_model: GROQ_EMBED_MODEL,
              folder_id,
              content_hash: chunk.hash,
            })
          ));
          newChunks += saveBatch.length;
        }
        if (b + EMBED_BATCH < toProcess.length) await new Promise(r => setTimeout(r, 300));
      }
    }

    return Response.json({ success: true, files_processed: files.length, total_chunks: totalChunks, new_chunks: newChunks, skipped_chunks: skippedChunks });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});