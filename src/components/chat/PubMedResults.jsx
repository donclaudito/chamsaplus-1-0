import React, { useState } from 'react';
import { ExternalLink, BookOpen, Users, Calendar, FlaskConical, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function PubMedResults({ articles, total, query }) {
  const [synthesis, setSynthesis] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!articles || articles.length === 0) return null;

  const handleAnalyze = async () => {
    setLoading(true);
    setSynthesis(null);
    try {
      const articlesSummary = articles.map((a, i) =>
        `${i + 1}. "${a.titulo}" — ${a.autores} (${a.fuente}, ${a.fecha_publicacion})`
      ).join('\n');

      const prompt = `Você é um assistente médico especialista. Com base nos seguintes artigos científicos recuperados do PubMed sobre "${query}", elabore um resumo clínico estruturado com:
- **Achados principais** dos estudos
- **Implicações clínicas** práticas
- **Nível de evidência** geral
- **Recomendações** baseadas na literatura

Artigos:
${articlesSummary}

Seja conciso, objetivo e clinicamente relevante.`;

      const res = await base44.functions.invoke('invokeLLMUnified', {
        messages: [
          { role: 'system', content: 'Você é um assistente médico especialista em síntese de evidências científicas.' },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.3-70b-versatile',
      });

      setSynthesis(res.data?.content || 'Sem resposta.');
    } catch (e) {
      setSynthesis(`Erro ao analisar: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 border-b border-blue-200">
        <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span className="text-xs font-bold text-blue-700">
          PubMed — {total > articles.length ? `${total} encontrados, mostrando ${articles.length}` : `${articles.length} artigos`}
        </span>
        <span className="text-[10px] text-blue-500 ml-auto truncate hidden sm:block">"{query}"</span>
      </div>
      <div className="divide-y divide-blue-100">
        {articles.map((a) => (
          <a
            key={a.pmid}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-blue-100/60 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                {a.titulo}
              </p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {a.autores && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Users className="w-2.5 h-2.5" />
                    {a.autores}{a.autores.includes(',') ? ' et al.' : ''}
                  </span>
                )}
                {a.fuente && (
                  <span className="text-[10px] text-blue-600 font-medium">{a.fuente}</span>
                )}
                {a.fecha_publicacion && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar className="w-2.5 h-2.5" />
                    {a.fecha_publicacion}
                  </span>
                )}
              </div>
            </div>
            <ExternalLink className="w-3 h-3 text-blue-400 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>

      {/* Botão Analisar */}
      <div className="px-3 py-2.5 border-t border-blue-200 bg-blue-50">
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
          {loading ? 'Analisando com Llama3...' : 'Analisar com Llama3'}
        </button>
      </div>

      {/* Síntese */}
      {synthesis && (
        <div className="px-3 pb-3 pt-1 border-t border-blue-200 bg-white">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-2">Síntese Clínica — Llama3</p>
          <div className="chamsa-prose text-xs">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{synthesis}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}