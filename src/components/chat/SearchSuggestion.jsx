import React from 'react';
import { Search, ExternalLink } from 'lucide-react';

export default function SearchSuggestion({ query }) {
  if (!query) return null;

  return (
    <div className="mt-2 pt-2 border-t border-border/50">
      <p className="text-[10px] text-muted-foreground/60 mb-1.5 uppercase tracking-wider font-semibold">
        Sugestão de Pesquisa
      </p>
      <a
        href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-400/30 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors"
      >
        <Search className="w-3 h-3 shrink-0" />
        <span className="line-clamp-1">{query}</span>
        <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
      </a>
    </div>
  );
}