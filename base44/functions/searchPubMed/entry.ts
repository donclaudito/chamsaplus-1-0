/**
 * searchPubMed
 * Busca artigos científicos na API PubMed usando ESearch + ESummary.
 * Retorna lista de artigos com título, autores, jornal, data e link.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query } = await req.json();
    if (!query) return Response.json({ error: 'query required' }, { status: 400 });

    // ESearch — buscar PMIDs do último ano
    const searchTerm = `${query} AND last 1 year[PDat]`;
    const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=5&term=${encodeURIComponent(searchTerm)}`;

    const esearchRes = await fetch(esearchUrl);
    if (!esearchRes.ok) throw new Error(`ESearch error: ${esearchRes.status}`);
    const esearchData = await esearchRes.json();

    const pmids = esearchData.esearchresult?.idlist || [];
    const totalFound = esearchData.esearchresult?.count || 0;

    if (pmids.length === 0) {
      return Response.json({ articles: [], total: 0 });
    }

    // ESummary — buscar detalhes dos artigos
    const esummaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${pmids.join(',')}`;
    const esummaryRes = await fetch(esummaryUrl);
    if (!esummaryRes.ok) throw new Error(`ESummary error: ${esummaryRes.status}`);
    const esummaryData = await esummaryRes.json();

    const articles = pmids.map(pmid => {
      const a = esummaryData.result?.[pmid];
      if (!a) return null;
      return {
        pmid,
        titulo: a.title || 'Sem título',
        autores: (a.authors || []).slice(0, 3).map(au => au.name).join(', '),
        fecha_publicacion: a.pubdate || '',
        fuente: a.source || '',
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      };
    }).filter(Boolean);

    return Response.json({ articles, total: parseInt(totalFound) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});