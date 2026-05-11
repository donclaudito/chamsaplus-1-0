import React, { useState, useRef } from 'react';
import { Send, ClipboardPaste, Loader2, LayoutPanelLeft, X, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import UploadedDocBadge from './UploadedDocBadge';

export default function ChatInput({ onSend, onPaste, onTool, onUpload, isLoading, canvasMode, uploadedDocs, onRemoveDoc }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onUpload) onUpload(file);
    e.target.value = '';
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
  };

  return (
    <div className="border-t border-border bg-card/80 backdrop-blur-sm p-3 sm:p-4 shrink-0 pb-[env(safe-area-inset-bottom,12px)]">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md,.csv"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="max-w-2xl mx-auto">

        {/* Canvas mode indicator */}
        <AnimatePresence>
          {canvasMode && (
            <motion.div
              initial={{ opacity: 0, y: 4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 4, height: 0 }}
              className="flex items-center gap-2 mb-2"
            >
              <div className="flex items-center gap-2 flex-1 bg-primary/8 border border-primary/25 rounded-xl px-3 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                <LayoutPanelLeft className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-[11px] font-semibold text-primary flex-1">
                  Modo Canvas ativo — respostas longas abrirão no painel lateral
                </span>
                <button
                  onClick={() => onTool && onTool('canvas')}
                  className="text-primary/60 hover:text-primary transition-colors"
                  title="Desativar Canvas"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <UploadedDocBadge docs={uploadedDocs} onRemove={onRemoveDoc} />
        <div className="flex items-end gap-2 bg-muted/40 border border-border rounded-2xl p-2">
          {/* Paste clinical data */}
          <button
            onClick={onPaste}
            className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all shrink-0 touch-manipulation active:bg-primary/10"
            title="Injetar dados clínicos"
          >
            <ClipboardPaste className="w-4 h-4" />
          </button>

          {/* Upload document */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all shrink-0 touch-manipulation active:bg-primary/10"
            title="Enviar documento (PDF, DOCX, TXT)"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Canvas toggle button */}
          <button
            onClick={() => onTool && onTool('canvas')}
            className={`p-2.5 rounded-xl transition-all shrink-0 touch-manipulation ${
              canvasMode
                ? 'text-primary bg-primary/15 border border-primary/30'
                : 'text-muted-foreground hover:text-primary hover:bg-primary/10 active:bg-primary/10'
            }`}
            title={canvasMode ? 'Desativar Canvas' : 'Ativar Canvas — painel lateral para documentos longos'}
          >
            <LayoutPanelLeft className="w-4 h-4" />
          </button>

          {/* Text area */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={canvasMode
              ? 'Peça um relatório, protocolo ou análise completa...'
              : 'Pergunte algo ou use ⊞ para abrir Canvas...'
            }
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-muted-foreground/50 py-2 max-h-40 leading-relaxed"
            style={{ fontSize: '16px' }}
          />

          {/* Send */}
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="rounded-xl h-10 w-10 shrink-0 touch-manipulation"
          >
            {isLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground/40 text-center mt-2 hidden sm:block">
          Chamsa Isa v4.1 · Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}