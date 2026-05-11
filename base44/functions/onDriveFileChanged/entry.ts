/**
 * onDriveFileChanged
 * Webhook handler — disparado automaticamente pelo conector Google Drive
 * quando um arquivo na pasta monitorada é criado ou atualizado.
 * Re-vetoriza apenas o arquivo alterado, mantendo a deduplicação por hash.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 150;

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

function hashEmbedding(text, dims = 256) {
  const tokens = tokenize(text);
  const tf = {};
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
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
    // Security: only accept calls from the Base44 platform (connector automations)
    // The platform sends the APP_ID in the Authorization header as a Bearer token
    const authHeader = req.headers.get('Authorization') || '';
    const appId = Deno.env.get('BASE44_APP_ID');
    if (!appId || authHeader !== `Bearer ${appId}`) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Payload from Drive webhook automation
    const fileId = body?.data?.fileId || body?.data?.id;
    const fileName = body?.data?.name || body?.data?.title || fileId;
    const mimeType = body?.data?.mimeType || '';

    if (!fileId) {
      return Response.json({ skipped: true, reason: 'No fileId in payload' });
    }

    // Only process supported text types
    const supported = [
      'application/vnd.google-apps.document',
      'text/plain',
      'text/markdown',
      'text/csv',
    ];
    if (!supported.includes(mimeType)) {
      return Response.json({ skipped: true, reason: `Unsupported mimeType: ${mimeType}` });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const headers = { Authorization: `Bearer ${accessToken}` };

    // Download file content
    let content = '';
    if (mimeType === 'application/vnd.google-apps.document') {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
        { headers }
      );
      content = await res.text();
    } else {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers }
      );
      content = await res.text();
    }

    if (!content.trim()) {
      return Response.json({ skipped: true, reason: 'Empty file content' });
    }

    const chunks = chunkText(content);
    const existing = await base44.asServiceRole.entities.KnowledgeVector.filter({ source_id: fileId });
    const existingHashes = new Set(existing.map(e => e.content_hash));

    const toCreate = [];
    for (let i = 0; i < chunks.length; i++) {
      const text = chunks[i];
      const hash = await hashText(text);
      if (existingHashes.has(hash)) continue;
      toCreate.push({ i, hash, text, embedding: hashEmbedding(text) });
    }

    const BATCH = 5;
    let newChunks = 0;
    for (let b = 0; b < toCreate.length; b += BATCH) {
      const batch = toCreate.slice(b, b + BATCH);
      await Promise.all(batch.map(({ i, hash, text, embedding }) =>
        base44.asServiceRole.entities.KnowledgeVector.create({
          source_id: fileId,
          source_name: fileName,
          source_type: 'drive',
          chunk_index: i,
          chunk_text: text,
          embedding,
          embedding_model: 'hash-tfidf-256d',
          content_hash: hash,
        })
      ));
      newChunks += batch.length;
      if (b + BATCH < toCreate.length) await new Promise(r => setTimeout(r, 300));
    }

    return Response.json({
      success: true,
      file: fileName,
      new_chunks: newChunks,
      skipped_chunks: chunks.length - newChunks,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});