import React, { useState, useRef } from 'react';
import { Send, ClipboardPaste, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChatInput({ onSend, onPaste, isLoading }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

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
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
  };

  return (
    <div className="border-t border-border bg-card/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 bg-muted/50 border border-border rounded-2xl p-2">
          <button
            onClick={onPaste}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all shrink-0"
            title="Colar dados clínicos"
          >
            <ClipboardPaste className="w-4 h-4" />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Consulte a Chamsa Isa..."
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-muted-foreground/50 py-2 max-h-32 sm:max-h-40"
            style={{ fontSize: '16px' }} /* prevents iOS zoom on focus */
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