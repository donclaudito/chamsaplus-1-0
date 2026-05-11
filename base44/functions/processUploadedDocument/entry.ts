/**
 * processUploadedDocument
 * Recebe um arquivo (PDF, DOCX, TXT) via base44 file_url,
 * extrai o texto, divide em chunks, gera embeddings via Groq
 * e salva em KnowledgeVector com folder_id = session_id (para RAG por sessão).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;
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

/**
 * Extrai texto de PDF usando uma abordagem simples de leitura de bytes.
 * Para PDFs simples extrai texto bruto; PDFs com imagens retornarão texto parcial.
 */
function extractTextFromPDF(buffer) {
  const text = new TextDecoder('latin1').decode(buffer);
  // Extrair streams de texto do PDF
  const results = [];
  const streamRegex = /stream([\s\S]*?)endstream/g;
  let match;
  while ((match = streamRegex.exec(text)) !== null) {
    const stream = match[1];
    // Extrair texto entre parênteses (strings PDF)
    const strRegex = /\(([^)\\]|\\.)*\)/g;
    let strMatch;
    while ((strMatch = strRegex.exec(stream)) !== null) {
      const raw = strMatch[0].slice(1, -1)
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\')
        .replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
      if (raw.length > 1) results.push(raw);
    }
  }
  return results.join(' ').replace(/\s{2,}/g, ' ').trim();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url, file_name, file_type, session_id } = await req.json();
    if (!file_url || !session_id) {
      return Response.json({ error: 'file_url and session_id required' }, { status: 400 });
    }

    const groqKey = Deno.env.get('GROQ_API_KEY');
    if (!groqKey) return Response.json({ error: 'GROQ_API_KEY not set' }, { status: 500 });

    // Download the file
    const fileResp = await fetch(file_url);
    if (!fileResp.ok) {
      throw new Error(`Failed to download file: ${fileResp.status}`);
    }

    const ext = (file_name || '').toLowerCase().split('.').pop();
    let extractedText = '';

    if (ext === 'txt' || ext === 'md' || ext === 'csv' || (file_type && file_type.startsWith('text/'))) {
      extractedText = await fileResp.text();
    } else if (ext === 'pdf' || file_type === 'application/pdf') {
      const buffer = await fileResp.arrayBuffer();
      extractedText = extractTextFromPDF(new Uint8Array(buffer));
      // If extraction yielded little text, use raw text decode as fallback
      if (extractedText.length < 100) {
        const rawText = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
        // Try to find readable text sequences
        const readable = rawText.match(/[\x20-\x7E\n\r\t]{4,}/g) || [];
        extractedText = readable.filter(s => /[a-zA-ZÀ-ü]{3,}/.test(s)).join(' ');
      }
    } else if (ext === 'docx' || file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // DOCX is a ZIP — extract word/document.xml
      const buffer = await fileResp.arrayBuffer();
      const rawText = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
      // Extract text between <w:t> tags in document.xml
      const wtMatches = rawText.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
      extractedText = wtMatches
        .map(m => m.replace(/<[^>]+>/g, ''))
        .join(' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
      // Fallback: readable ASCII
      if (extractedText.length < 100) {
        const readable = rawText.match(/[\x20-\x7E\n\r\t]{4,}/g) || [];
        extractedText = readable.filter(s => /[a-zA-ZÀ-ü]{3,}/.test(s)).join(' ');
      }
    } else {
      // Generic: try as text
      extractedText = await fileResp.text();
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return Response.json({
        error: 'Não foi possível extrair texto suficiente do arquivo. Verifique se o documento contém texto selecionável.',
      }, { status: 422 });
    }

    const chunks = chunkText(extractedText);
    if (chunks.length === 0) {
      return Response.json({ error: 'Nenhum chunk de texto gerado.' }, { status: 422 });
    }

    // Remove existing vectors for this file in this session (re-upload scenario)
    const existing = await base44.asServiceRole.entities.KnowledgeVector.filter({
      source_id: `upload_${session_id}_${file_name}`,
    });
    if (existing.length > 0) {
      await Promise.all(existing.map(v => base44.asServiceRole.entities.KnowledgeVector.delete(v.id)));
    }

    // Generate embeddings in batches of 20
    const EMBED_BATCH = 20;
    let savedChunks = 0;
    for (let b = 0; b < chunks.length; b += EMBED_BATCH) {
      const batch = chunks.slice(b, b + EMBED_BATCH);
      const embeddings = await getEmbeddings(batch, groqKey);

      const SAVE_BATCH = 5;
      for (let s = 0; s < batch.length; s += SAVE_BATCH) {
        const saveBatch = batch.slice(s, s + SAVE_BATCH);
        await Promise.all(saveBatch.map(async (chunkText_, j) => {
          const hash = await hashText(chunkText_);
          await base44.asServiceRole.entities.KnowledgeVector.create({
            source_id: `upload_${session_id}_${file_name}`,
            source_name: file_name || 'documento',
            source_type: 'upload',
            chunk_index: b + s + j,
            chunk_text: chunkText_,
            embedding: embeddings[s + j],
            embedding_model: GROQ_EMBED_MODEL,
            folder_id: `upload_${session_id}`,
            content_hash: hash,
          });
          savedChunks++;
        }));
      }

      if (b + EMBED_BATCH < chunks.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    return Response.json({
      success: true,
      file_name: file_name || 'documento',
      chunks_saved: savedChunks,
      folder_id: `upload_${session_id}`,
      text_length: extractedText.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});