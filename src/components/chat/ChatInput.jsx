import React, { useState, useRef, useEffect } from 'react';
import { Send, ClipboardPaste, Loader2, SlidersHorizontal, LayoutPanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';

const tools = [
  {
    id: 'canvas',
    icon: LayoutPanelLeft,
    label: 'Canvas',
    description: 'Gerar resumo estruturado no painel lateral',
  },
];

export default function ChatInput({ onSend, onPaste, onTool, isLoading, canvasMode }) {
  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const textareaRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  const handleToolClick = (toolId) => {
    setMenuOpen(false);
    onTool && onTool(toolId);
  };

  return (
    <div className="border-t border-border bg-card/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="max-w-3xl mx-auto">
        {/* Canvas mode badge */}
        {canvasMode && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <button
              onClick={() => onTool && onTool('canvas')}
              className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 text-primary text-[11px] font-semibold px-3 py-1 rounded-full hover:bg-primary/20 transition-colors"
            >
              <LayoutPanelLeft className="w-3 h-3" />
              Canvas
              <span className="ml-1 text-primary/60 hover:text-primary">×</span>
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 bg-muted/50 border border-border rounded-2xl p-2">
          {/* Paste button */}
          <button
            onClick={onPaste}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all shrink-0"
            title="Colar dados clínicos"
          >
            <ClipboardPaste className="w-4 h-4" />
          </button>

          {/* Tools button */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className={`p-2 rounded-xl transition-all ${menuOpen ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
              title="Ferramentas"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 6 }}
                  transition={{ duration: 0.13 }}
                  className="absolute bottom-10 left-0 z-50 w-56 bg-popover border border-border rounded-xl shadow-xl overflow-hidden"
                >
                  <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Ferramentas
                  </p>
                  {tools.map(({ id, icon: Icon, label, description }) => (
                    <button
                      key={id}
                      onClick={() => handleToolClick(id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
                    >
                      <Icon className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">{label}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{description}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Consulte a Chamsa Isa..."
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-muted-foreground/50 py-2 max-h-32 sm:max-h-40"
            style={{ fontSize: '16px' }}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="rounded-xl h-10 w-10 sm:h-9 sm:w-9 shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/40 text-center mt-2 hidden sm:block">
          Chamsa Isa v4.1 — Protocolo ReAct Clínico Ativo
        </p>
      </div>
    </div>
  );
}