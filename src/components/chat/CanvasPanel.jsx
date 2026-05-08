import React, { useState, useEffect, useRef } from 'react';
import {
  X, Maximize2, Minimize2, Printer, Share2,
  RotateCcw, RotateCw, Bold, Italic, List,
  ListOrdered, FileText, Eye, Pencil
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function CanvasPanel({ content, title, onClose }) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState('preview'); // 'preview' | 'edit'
  const [text, setText] = useState(content || '');
  const [history, setHistory] = useState([content || '']);
  const [historyIdx, setHistoryIdx] = useState(0);
  const textareaRef = useRef(null);

  // Sync when new content arrives from AI
  useEffect(() => {
    if (content) {
      setText(content);
      setHistory([content]);
      setHistoryIdx(0);
    }
  }, [content]);

  if (!content) return null;

  const commit = (newText) => {
    const next = history.slice(0, historyIdx + 1);
    next.push(newText);
    setHistory(next);
    setHistoryIdx(next.length - 1);
    setText(newText);
  };

  const undo = () => {
    if (historyIdx > 0) {
      const idx = historyIdx - 1;
      setHistoryIdx(idx);
      setText(history[idx]);
    }
  };

  const redo = () => {
    if (historyIdx < history.length - 1) {
      const idx = historyIdx + 1;
      setHistoryIdx(idx);
      setText(history[idx]);
    }
  };

  // Insert markdown syntax around selection in textarea
  const wrap = (before, after = before) => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const selected = value.slice(s, e);
    const newVal = value.slice(0, s) + before + selected + after + value.slice(e);
    commit(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(s + before.length, e + before.length);
    }, 0);
  };

  const insertList = (ordered) => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: s, value } = el;
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    const prefix = ordered ? '1. ' : '- ';
    const newVal = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    commit(newVal);
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>${title || 'Canvas'}</title>
      <style>body{font-family:sans-serif;padding:2rem;line-height:1.7;max-width:800px;margin:auto}
      h1,h2,h3{font-weight:700;margin-top:1em}ul,ol{margin-left:1.5em}
      code{background:#f0f0f0;padding:2px 6px;border-radius:4px;font-family:monospace}
      strong{font-weight:700}em{font-style:italic}</style>
    </head><body><pre style="white-space:pre-wrap;font-family:sans-serif">${text}</pre></body></html>`);
    win.document.close();
    win.print();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className={`flex flex-col bg-background transition-all duration-300 ${
      expanded ? 'fixed inset-0 z-50' : 'h-full'
    }`}>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border bg-card shrink-0 overflow-x-auto">

        {/* Doc icon + title */}
        <div className="flex items-center gap-1.5 pr-3 shrink-0">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground truncate max-w-[160px]">
            {title || 'Canvas'}
          </span>
        </div>

        <div className="w-px h-4 bg-border mx-1 shrink-0" />

        {/* Undo / Redo */}
        <button onClick={undo} disabled={historyIdx === 0}
          className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-30" title="Desfazer (Ctrl+Z)">
          <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button onClick={redo} disabled={historyIdx >= history.length - 1}
          className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-30" title="Refazer">
          <RotateCw className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        <div className="w-px h-4 bg-border mx-1 shrink-0" />

        {/* Format dropdown */}
        <select
          onChange={e => {
            if (!textareaRef.current) return;
            const tag = e.target.value;
            const el = textareaRef.current;
            const { selectionStart: s, value } = el;
            const lineStart = value.lastIndexOf('\n', s - 1) + 1;
            const lineEnd = value.indexOf('\n', s);
            const end = lineEnd === -1 ? value.length : lineEnd;
            const lineContent = value.slice(lineStart, end).replace(/^#{1,3}\s/, '');
            const prefix = tag === 'h1' ? '# ' : tag === 'h2' ? '## ' : tag === 'h3' ? '### ' : '';
            const newVal = value.slice(0, lineStart) + prefix + lineContent + value.slice(end);
            commit(newVal);
            if (mode === 'preview') setMode('edit');
          }}
          defaultValue="p"
          className="text-[11px] bg-transparent border border-border rounded px-2 py-0.5 text-foreground cursor-pointer hover:bg-muted transition-colors"
        >
          <option value="p">Texto normal</option>
          <option value="h1">Título 1</option>
          <option value="h2">Título 2</option>
          <option value="h3">Título 3</option>
        </select>

        <div className="w-px h-4 bg-border mx-1 shrink-0" />

        {/* Bold / Italic / Lists */}
        <button onClick={() => { setMode('edit'); wrap('**'); }}
          className="p-1.5 rounded hover:bg-muted transition-colors" title="Negrito">
          <Bold className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button onClick={() => { setMode('edit'); wrap('*'); }}
          className="p-1.5 rounded hover:bg-muted transition-colors" title="Itálico">
          <Italic className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button onClick={() => { setMode('edit'); insertList(false); }}
          className="p-1.5 rounded hover:bg-muted transition-colors" title="Lista">
          <List className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button onClick={() => { setMode('edit'); insertList(true); }}
          className="p-1.5 rounded hover:bg-muted transition-colors" title="Lista numerada">
          <ListOrdered className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Preview / Edit toggle */}
        <button
          onClick={() => setMode(m => m === 'preview' ? 'edit' : 'preview')}
          className={`p-1.5 rounded transition-colors flex items-center gap-1 text-[11px] font-medium
            ${mode === 'edit' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
          title={mode === 'edit' ? 'Ver preview' : 'Editar'}
        >
          {mode === 'edit' ? <Eye className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
        </button>

        <div className="w-px h-4 bg-border mx-1 shrink-0" />

        <button onClick={handlePrint}
          className="p-1.5 rounded hover:bg-muted transition-colors" title="Imprimir">
          <Printer className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button onClick={handleShare}
          className="p-1.5 rounded hover:bg-muted transition-colors" title="Compartilhar">
          <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button onClick={() => setExpanded(e => !e)}
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title={expanded ? 'Minimizar' : 'Expandir'}>
          {expanded
            ? <Minimize2 className="w-3.5 h-3.5 text-muted-foreground" />
            : <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
        <button onClick={onClose}
          className="p-1.5 rounded hover:bg-muted transition-colors" title="Fechar">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* ── Content Area ── */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'preview' ? (
          /* Preview: Markdown rendered */
          <div
            className="px-10 py-8 cursor-text"
            onClick={() => setMode('edit')}
          >
            <div className="chamsa-prose text-sm max-w-none">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          </div>
        ) : (
          /* Edit: raw markdown textarea */
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={() => commit(text)}
            onKeyDown={e => {
              if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undo(); }
              if (e.key === 'y' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); redo(); }
            }}
            autoFocus
            className="w-full h-full min-h-full px-10 py-8 text-sm font-mono bg-background text-foreground
              resize-none outline-none border-0 leading-relaxed"
            placeholder="Escreva em Markdown..."
          />
        )}
      </div>
    </div>
  );
}