import React, { useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function CanvasPanel({ content, title, onClose }) {
  const [expanded, setExpanded] = useState(false);

  if (!content) return null;

  return (
    <div className={`flex flex-col h-full bg-card border-l border-border transition-all duration-300 ${expanded ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold text-foreground truncate max-w-[180px]">
            {title || 'Canvas'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
            title={expanded ? 'Minimizar' : 'Expandir'}
          >
            {expanded
              ? <Minimize2 className="w-3.5 h-3.5 text-muted-foreground" />
              : <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
            }
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
            title="Fechar canvas"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="chamsa-prose text-sm">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}