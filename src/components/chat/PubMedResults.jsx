import React from 'react';
import { ExternalLink, BookOpen, Users, Calendar } from 'lucide-react';

export default function PubMedResults({ articles, total, query }) {
  if (!articles || articles.length === 0) return null;

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
                {a.title}
              </p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {a.authors && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Users className="w-2.5 h-2.5" />
                    {a.authors}{a.authors.includes(',') ? ' et al.' : ''}
                  </span>
                )}
                {a.journal && (
                  <span className="text-[10px] text-blue-600 font-medium">{a.journal}</span>
                )}
                {a.pubdate && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar className="w-2.5 h-2.5" />
                    {a.pubdate}
                  </span>
                )}
              </div>
            </div>
            <ExternalLink className="w-3 h-3 text-blue-400 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>
    </div>
  );
}