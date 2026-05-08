import React, { useState, useRef } from 'react';
import { X, Maximize2, Minimize2, Printer, Share2, RotateCcw, RotateCw, Bold, Italic, List, ListOrdered, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function CanvasPanel({ content, title, onClose }) {
  const [expanded, setExpanded] = useState(false);
  const [editableContent, setEditableContent] = useState(content);
  const [history, setHistory] = useState([content]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const editorRef = useRef(null);

  if (!content) return null;

  const pushHistory = (newContent) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newContent);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setEditableContent(newContent);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      setHistoryIndex(idx);
      setEditableContent(history[idx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1;
      setHistoryIndex(idx);
      setEditableContent(history[idx]);
    }
  };

  const execCmd = (cmd, value = null) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>${title || 'Canvas'}</title><style>body{font-family:sans-serif;padding:2rem;line-height:1.7;max-width:800px;margin:auto}h1,h2,h3{font-weight:700;margin-top:1em}ul,ol{margin-left:1.5em}code{background:#f0f0f0;padding:2px 6px;border-radius:4px;font-family:monospace}</style></head><body>${editorRef.current?.innerHTML || editableContent}</body></html>`);
    win.document.close();
    win.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className={`flex flex-col h-full bg-card transition-all duration-300 ${expanded ? 'fixed inset-0 z-50 border-0' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/20 shrink-0 overflow-x-auto">
        {/* Title */}
        <div className="flex items-center gap-1.5 mr-2 shrink-0">
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
            {title || 'Canvas'}
          </span>
        </div>

        <div className="w-px h-4 bg-border mx-1 shrink-0" />

        {/* Undo / Redo */}
        <button onClick={handleUndo} disabled={historyIndex === 0} className="p-1.5 hover:bg-muted rounded transition-colors disabled:opacity-30" title="Desfazer">
          <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button onClick={handleRedo} disabled={historyIndex === history.length - 1} className="p-1.5 hover:bg-muted rounded transition-colors disabled:opacity-30" title="Refazer">
          <RotateCw className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        <div className="w-px h-4 bg-border mx-1 shrink-0" />

        {/* Text style selector */}
        <select
          onChange={e => execCmd('formatBlock', e.target.value)}
          className="text-[11px] bg-transparent border border-border rounded px-1.5 py-0.5 text-foreground cursor-pointer"
        >
          <option value="p">Texto normal</option>
          <option value="h1">Título 1</option>
          <option value="h2">Título 2</option>
          <option value="h3">Título 3</option>
        </select>

        <div className="w-px h-4 bg-border mx-1 shrink-0" />

        {/* Formatting */}
        <button onClick={() => execCmd('bold')} className="p-1.5 hover:bg-muted rounded transition-colors font-bold text-xs text-foreground" title="Negrito">
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => execCmd('italic')} className="p-1.5 hover:bg-muted rounded transition-colors italic text-xs text-foreground" title="Itálico">
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 hover:bg-muted rounded transition-colors" title="Lista">
          <List className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button onClick={() => execCmd('insertOrderedList')} className="p-1.5 hover:bg-muted rounded transition-colors" title="Lista numerada">
          <ListOrdered className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <button onClick={handlePrint} className="p-1.5 hover:bg-muted rounded transition-colors" title="Imprimir">
          <Printer className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button onClick={handleCopyLink} className="p-1.5 hover:bg-muted rounded transition-colors" title="Compartilhar link">
          <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button onClick={() => setExpanded(e => !e)} className="p-1.5 hover:bg-muted rounded transition-colors" title={expanded ? 'Minimizar' : 'Expandir'}>
          {expanded ? <Minimize2 className="w-3.5 h-3.5 text-muted-foreground" /> : <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
        <button onClick={onClose} className="p-1.5 hover:bg-muted rounded transition-colors" title="Fechar">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Editable Content Area */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => pushHistory(e.currentTarget.innerHTML)}
          className="chamsa-prose text-sm outline-none min-h-full"
          dangerouslySetInnerHTML={{ __html: editableContent }}
        />
      </div>
    </div>
  );
}