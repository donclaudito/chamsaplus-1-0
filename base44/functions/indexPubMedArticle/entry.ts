/**
 * indexPubMedArticle
 * Busca o abstract completo de um artigo PubMed via EFetch,
 * gera embeddings (tenta Groq, fallback sem embedding para keyword search)
 * e salva em KnowledgeVector com folder_id = upload_{session_id}
 * (mesmo namespace dos docs da sessão, para RAG unificado).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GROQ_EMBED_MODELS = ['nomic-embed-text-v1.5', 'nomic-embed-text-v1_5'];
const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;

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

async function tryGetEmbeddings(texts, groqKey) {
  for (const model of GROQ_EMBED_MODELS) {
    const resp = await fetch('https://api.groq.com/openai/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input: texts }),
    });
    if (resp.ok) {
      const data = await resp.json();
      return { embeddings: data.data.map(d => d.embedding), model };
    }
  }
  return null; // embeddings indisponíveis — fallback keyword search
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { pmid, titulo, autores, fuente, fecha_publicacion, session_id } = await req.json();
    if (!pmid || !session_id) return Response.json({ error: 'pmid and session_id required' }, { status: 400 });

    const groqKey = Deno.env.get('GROQ_API_KEY');
    if (!groqKey) return Response.json({ error: 'GROQ_API_KEY not set' }, { status: 500 });

    // Buscar abstract via EFetch
    const efetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=text&rettype=abstract&id=${pmid}`;
    const efetchRes = await fetch(efetchUrl);
    if (!efetchRes.ok) throw new Error(`EFetch error: ${efetchRes.status}`);
    const abstractText = await efetchRes.text();

    if (!abstractText || abstractText.trim().length < 30) {
      return Response.json({ error: 'Abstract não disponível para este artigo.' }, { status: 422 });
    }

    // Montar texto completo para indexação
    const fullText = [
      `Title: ${titulo}`,
      autores ? `Authors: ${autores}` : '',
      fuente ? `Journal: ${fuente}` : '',
      fecha_publicacion ? `Published: ${fecha_publicacion}` : '',
      `PMID: ${pmid}`,
      `URL: https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      '',
      abstractText.trim(),
    ].filter(Boolean).join('\n');

    const source_id = `pubmed_${session_id}_${pmid}`;
    const folder_id = `upload_${session_id}`;

    // Remover indexação anterior do mesmo artigo nesta sessão
    const existing = await base44.asServiceRole.entities.KnowledgeVector.filter({ source_id });
    if (existing.length > 0) {
      await Promise.all(existing.map(v => base44.asServiceRole.entities.KnowledgeVector.delete(v.id)));
    }

    const chunks = chunkText(fullText);
    if (chunks.length === 0) return Response.json({ error: 'Nenhum chunk gerado.' }, { status: 422 });

    // Tentar gerar embeddings — fallback keyword search se falhar
    const embResult = await tryGetEmbeddings(chunks, groqKey);

    await Promise.all(chunks.map(async (chunk, i) => {
      const record = {
        source_id,
        source_name: titulo ? titulo.slice(0, 120) : `PubMed ${pmid}`,
        source_type: 'knowledge',
        chunk_index: i,
        chunk_text: chunk,
        embedding_model: embResult ? embResult.model : 'keyword_only',
        folder_id,
      };
      if (embResult) {
        record.embedding = embResult.embeddings[i];
      }
      await base44.asServiceRole.entities.KnowledgeVector.create(record);
    }));

    return Response.json({
      success: true,
      pmid,
      chunks_saved: chunks.length,
      folder_id,
      embedding_mode: embResult ? embResult.model : 'keyword_fallback',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});