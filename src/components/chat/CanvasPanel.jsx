import React, { useState, useEffect, useRef } from 'react';
import {
  X, Maximize2, Minimize2, Printer, Share2,
  RotateCcw, RotateCw, Bold, Italic, List,
  ListOrdered, FileText, Eye, Pencil, Copy, Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function CanvasPanel({ content, title, onClose }) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState('preview');
  const [text, setText] = useState(content || '');
  const [history, setHistory] = useState([content || '']);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (content) {
      setText(content);
      setHistory([content]);
      setHistoryIdx(0);
      setMode('preview');
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

  const insertLinePrefix = (prefix) => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: s, value } = el;
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    const newVal = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    commit(newVal);
    setTimeout(() => { el.focus(); el.setSelectionRange(s + prefix.length, s + prefix.length); }, 0);
  };

  const applyHeading = (e) => {
    const tag = e.target.value;
    const el = textareaRef.current;
    if (!el) { setMode('edit'); return; }
    const { selectionStart: s, value } = el;
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    const lineEnd = value.indexOf('\n', s);
    const end = lineEnd === -1 ? value.length : lineEnd;
    const lineContent = value.slice(lineStart, end).replace(/^#{1,3}\s/, '');
    const prefix = tag === 'h1' ? '# ' : tag === 'h2' ? '## ' : tag === 'h3' ? '### ' : '';
    const newVal = value.slice(0, lineStart) + prefix + lineContent + value.slice(end);
    commit(newVal);
    if (mode !== 'edit') setMode('edit');
    e.target.value = 'p';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>${title || 'Canvas'}</title>
      <style>body{font-family:sans-serif;padding:2rem;line-height:1.7;max-width:800px;margin:auto}
      h1{font-size:1.6rem}h2{font-size:1.3rem}h3{font-size:1.1rem}
      h1,h2,h3{font-weight:700;margin-top:1em;margin-bottom:.4em}
      ul,ol{margin-left:1.5em;margin-bottom:.75em}li{margin-bottom:.2em}
      code{background:#f0f0f0;padding:2px 6px;border-radius:4px;font-family:monospace}
      pre{background:#f0f0f0;padding:1em;border-radius:8px;overflow-x:auto}
      strong{font-weight:700}em{font-style:italic}
      blockquote{border-left:3px solid #888;padding-left:1em;color:#555}
      </style>
    </head><body></body></html>`);
    // Use innerHTML from a DOM parse of the markdown text
    win.document.body.innerText = text;
    win.document.close();
    win.print();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(text);
  };

  const switchMode = () => {
    const next = mode === 'preview' ? 'edit' : 'preview';
    if (next === 'edit') commit(text);
    setMode(next);
  };

  return (
    <div className={`flex flex-col bg-background transition-all duration-300 ${expanded ? 'fixed inset-0 z-50' : 'h-full'}`}>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-0.5 px-2 py-2 border-b border-border bg-card shrink-0 overflow-x-auto">

        {/* Doc icon + title */}
        <div className="flex items-center gap-1.5 pr-2 shrink-0">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
            {title || 'Canvas'}
          </span>
        </div>

        <div className="w-px h-4 bg-border mx-1 shrink-0" />

        {/* Undo / Redo */}
        <button
          onClick={undo}
          disabled={historyIdx === 0}
          className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-30"
          title="Desfazer (Ctrl+Z)"
        >
          <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={redo}
          disabled={historyIdx >= history.length - 1}
          className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-30"
          title="Refazer (Ctrl+Y)"
        >
          <RotateCw className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        <div className="w-px h-4 bg-border mx-1 shrink-0" />

        {/* Heading dropdown */}
        <select
          onChange={applyHeading}
          defaultValue="p"
          className="text-[11px] bg-transparent border border-border rounded-md px-1.5 py-0.5 text-foreground cursor-pointer hover:bg-muted transition-colors shrink-0"
        >
          <option value="p">Normal</option>
          <option value="h1">Título 1</option>
          <option value="h2">Título 2</option>
          <option value="h3">Título 3</option>
        </select>

        <div className="w-px h-4 bg-border mx-1 shrink-0" />

        {/* Bold */}
        <button
          onClick={() => { setMode('edit'); wrap('**'); }}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          title="Negrito (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        {/* Italic */}
        <button
          onClick={() => { setMode('edit'); wrap('*'); }}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          title="Itálico (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        {/* Bullet list */}
        <button
          onClick={() => { setMode('edit'); insertLinePrefix('- '); }}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          title="Lista"
        >
          <List className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        {/* Ordered list */}
        <button
          onClick={() => { setMode('edit'); insertLinePrefix('1. '); }}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          title="Lista numerada"
        >
          <ListOrdered className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Preview / Edit toggle */}
        <button
          onClick={switchMode}
          className={`p-1.5 rounded-md transition-colors flex items-center gap-1 text-[11px] font-medium
            ${mode === 'edit' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
          title={mode === 'edit' ? 'Ver preview' : 'Editar'}
        >
          {mode === 'edit'
            ? <Eye className="w-3.5 h-3.5" />
            : <Pencil className="w-3.5 h-3.5" />
          }
        </button>

        <div className="w-px h-4 bg-border mx-1 shrink-0" />

        {/* Copy */}
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          title="Copiar conteúdo"
        >
          {copied
            ? <Check className="w-3.5 h-3.5 text-emerald-500" />
            : <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          }
        </button>
        {/* Print */}
        <button
          onClick={handlePrint}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          title="Imprimir"
        >
          <Printer className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        {/* Share */}
        <button
          onClick={handleShare}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          title="Copiar link"
        >
          <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        {/* Expand */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          title={expanded ? 'Minimizar' : 'Expandir'}
        >
          {expanded
            ? <Minimize2 className="w-3.5 h-3.5 text-muted-foreground" />
            : <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
          }
        </button>
        {/* Close */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          title="Fechar"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* ── Content Area ── */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'preview' ? (
          <div
            className="px-8 py-8 cursor-text h-full"
            onClick={switchMode}
          >
            <div className="chamsa-prose text-sm max-w-none">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={() => commit(text)}
            onKeyDown={e => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
              if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
              if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); wrap('**'); }
              if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); wrap('*'); }
            }}
            autoFocus
            spellCheck
            className="w-full px-8 py-8 text-sm font-mono bg-background text-foreground
              resize-none outline-none border-0 leading-relaxed"
            style={{ minHeight: '100%', height: '100%' }}
            placeholder="Escreva em Markdown..."
          />
        )}
      </div>
    </div>
  );
}