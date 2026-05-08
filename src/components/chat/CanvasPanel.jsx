import React, { useState, useEffect, useRef } from 'react';
import {
  X, Maximize2, Minimize2, Printer,
  RotateCcw, RotateCw, Bold, Italic, List,
  ListOrdered, FileText, Eye, Pencil, Copy, Check,
  Download, ChevronDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function CanvasPanel({ content, title, onClose }) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState('preview');
  const [text, setText] = useState(content || '');
  const [history, setHistory] = useState([content || '']);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [headingValue, setHeadingValue] = useState('p');
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
    if (!el) { setMode('edit'); return; }
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
    if (!el) { setMode('edit'); return; }
    const { selectionStart: s, value } = el;
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    const newVal = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    commit(newVal);
    setTimeout(() => { el.focus(); }, 0);
  };

  const applyHeading = (e) => {
    const tag = e.target.value;
    setHeadingValue('p'); // reset controlled select
    if (!textareaRef.current) { setMode('edit'); return; }
    const el = textareaRef.current;
    const { selectionStart: s, value } = el;
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    const lineEnd   = value.indexOf('\n', s);
    const end       = lineEnd === -1 ? value.length : lineEnd;
    const lineContent = value.slice(lineStart, end).replace(/^#{1,3}\s/, '');
    const prefix = tag === 'h1' ? '# ' : tag === 'h2' ? '## ' : tag === 'h3' ? '### ' : '';
    commit(value.slice(0, lineStart) + prefix + lineContent + value.slice(end));
    setMode('edit');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'canvas'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    // Captura o HTML renderizado do preview (igual ao que o usuário vê)
    const previewEl = document.getElementById('canvas-preview-content');
    const renderedHTML = previewEl ? previewEl.innerHTML : `<pre style="white-space:pre-wrap">${text}</pre>`;

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>${title || 'Canvas'}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; padding: 3rem; line-height: 1.8; max-width: 820px; margin: auto; color: #1a1a1a; font-size: 14px; }
        h1 { font-size: 1.6rem; border-bottom: 2px solid #e5e7eb; padding-bottom: .5em; margin-bottom: 1em; font-weight: 700; }
        h2 { font-size: 1.25rem; margin-top: 1.5em; margin-bottom: .4em; font-weight: 700; }
        h3 { font-size: 1.05rem; margin-top: 1.2em; margin-bottom: .3em; font-weight: 600; }
        p { margin-bottom: .75em; }
        ul, ol { margin-left: 1.5em; margin-bottom: .75em; }
        li { margin-bottom: .25em; }
        strong { font-weight: 700; }
        em { font-style: italic; }
        code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: .88em; }
        pre { background: #f3f4f6; padding: 1em; border-radius: 8px; overflow-x: auto; margin-bottom: .75em; font-size: .88em; }
        blockquote { border-left: 3px solid #6366f1; padding-left: 1em; color: #555; margin: 1em 0; font-style: italic; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 1em; font-size: .9em; }
        thead tr { background: #f3f4f6; border-bottom: 2px solid #d1d5db; }
        th { padding: .5em 1em; text-align: left; font-weight: 700; font-size: .8rem; letter-spacing: .04em; white-space: nowrap; }
        td { padding: .45em 1em; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
        tbody tr:last-child td { border-bottom: none; }
        tbody tr:nth-child(even) { background: #fafafa; }
        @media print { body { padding: 1.5rem; } }
      </style>
    </head><body>
      <h1>${title || 'Canvas'}</h1>
      ${renderedHTML}
    </body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 400);
  };

  const switchMode = () => {
    if (mode === 'preview') {
      setMode('edit');
    } else {
      commit(text);
      setMode('preview');
    }
  };

  const ToolBtn = ({ onClick, disabled, title: t, children, active }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={t}
      className={`p-1.5 rounded-md transition-all disabled:opacity-30 shrink-0
        ${active
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-4 bg-border mx-0.5 shrink-0" />;

  return (
    <div className={`flex flex-col bg-card transition-all duration-300 ${expanded ? 'fixed inset-0 z-50 rounded-none' : 'h-full rounded-none'}`}>

      {/* ── Header / Toolbar ── */}
      <div className="shrink-0 border-b border-border">
        {/* Top row: title + actions */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-card">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate leading-tight">
                {title || 'Canvas'}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Documento gerado pela Chamsa
              </p>
            </div>
          </div>

          {/* Mode toggle */}
          <button
            onClick={switchMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all border
              ${mode === 'edit'
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              }`}
          >
            {mode === 'edit' ? <Eye className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
            {mode === 'edit' ? 'Preview' : 'Editar'}
          </button>

          <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title={expanded ? 'Minimizar' : 'Expandir'}>
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Fechar Canvas">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formatting toolbar */}
        <div className="flex items-center gap-0.5 px-3 py-1.5 bg-muted/30 overflow-x-auto">
          <ToolBtn onClick={undo} disabled={historyIdx === 0} title="Desfazer (Ctrl+Z)">
            <RotateCcw className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={redo} disabled={historyIdx >= history.length - 1} title="Refazer (Ctrl+Y)">
            <RotateCw className="w-3.5 h-3.5" />
          </ToolBtn>

          <Divider />

          {/* Heading select */}
          <div className="relative shrink-0">
            <select
              value={headingValue}
              onChange={applyHeading}
              className="appearance-none pl-2 pr-5 py-0.5 text-[11px] bg-transparent border border-border rounded-md text-foreground cursor-pointer hover:bg-muted transition-colors"
            >
              <option value="p">Normal</option>
              <option value="h1">Título 1</option>
              <option value="h2">Título 2</option>
              <option value="h3">Título 3</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          <Divider />

          <ToolBtn onClick={() => { setMode('edit'); setTimeout(() => wrap('**'), 0); }} title="Negrito (Ctrl+B)">
            <Bold className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => { setMode('edit'); setTimeout(() => wrap('*'), 0); }} title="Itálico (Ctrl+I)">
            <Italic className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => { setMode('edit'); setTimeout(() => insertLinePrefix('- '), 0); }} title="Lista">
            <List className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => { setMode('edit'); setTimeout(() => insertLinePrefix('1. '), 0); }} title="Lista numerada">
            <ListOrdered className="w-3.5 h-3.5" />
          </ToolBtn>

          <div className="flex-1" />

          <ToolBtn onClick={handleCopy} title={copied ? 'Copiado!' : 'Copiar Markdown'} active={copied}>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </ToolBtn>
          <ToolBtn onClick={handleExport} title="Exportar .md">
            <Download className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={handlePrint} title="Imprimir">
            <Printer className="w-3.5 h-3.5" />
          </ToolBtn>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="flex-1 overflow-y-auto bg-background">
        {mode === 'preview' ? (
          <div
            className="px-10 py-8 min-h-full cursor-text"
            onClick={switchMode}
            title="Clique para editar"
          >
            <div id="canvas-preview-content" className="chamsa-prose text-sm max-w-none prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
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
            className="w-full h-full px-10 py-8 text-sm font-mono bg-background text-foreground resize-none outline-none border-0 leading-relaxed"
            style={{ minHeight: 'calc(100vh - 160px)' }}
            placeholder="Escreva em Markdown..."
          />
        )}
      </div>
    </div>
  );
}