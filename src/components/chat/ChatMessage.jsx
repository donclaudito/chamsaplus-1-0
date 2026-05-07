import React, { useState } from 'react';
import { Bot, User, Copy, Check, FileDown } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function ChatMessage({ message }) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';
  const isData = message.role === 'data-block';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center my-3"
      >
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 max-w-md text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <FileDown className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">{message.title || 'Dado Clínico'}</span>
          </div>
          <p className="text-[11px] text-muted-foreground line-clamp-2">{message.content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
    >
      {isAssistant && (
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}

      <div className={`
        max-w-[80%] group relative
        ${isAssistant
          ? 'bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3'
          : 'bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-3'
        }
      `}>
        {isAssistant ? (
          <div className="chamsa-prose text-sm">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}

        {/* Actions */}
        {isAssistant && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleCopy} className="p-1 hover:bg-muted rounded-md transition-colors">
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
            </button>
          </div>
        )}

        <span className="text-[10px] text-muted-foreground/50 mt-1 block">
          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
        </span>
      </div>

      {!isAssistant && (
        <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-1">
          <User className="w-4 h-4 text-foreground" />
        </div>
      )}
    </motion.div>
  );
}