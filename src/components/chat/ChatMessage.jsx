import React, { useState } from 'react';
import { Bot, User, Copy, Check, FileDown, Printer, ThumbsUp, ThumbsDown, MoreHorizontal, LayoutPanelLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jsPDF } from 'jspdf';
import SearchSuggestion from './SearchSuggestion';

export default function ChatMessage({ message, onRetryWithoutCanvas }) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(null); // 'up' | 'down' | null
  const isAssistant = message.role === 'assistant';
  const isData = message.role === 'data-block';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Chamsa Isa — Resposta Clínica', margin, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120);
    const ts = message.timestamp
      ? new Date(message.timestamp).toLocaleString('pt-BR')
      : new Date().toLocaleString('pt-BR');
    doc.text(ts, margin, 27);

    doc.setDrawColor(200);
    doc.line(margin, 30, pageWidth - margin, 30);

    doc.setTextColor(30);
    doc.setFontSize(10);
    // Strip markdown syntax for clean PDF text
    const plain = message.content
      .replace(/#{1,6}\s?/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`{1,3}(.*?)`{1,3}/gs, '$1')
      .replace(/>\s?/g, '')
      .replace(/---+/g, '');

    const lines = doc.splitTextToSize(plain, maxWidth);
    doc.text(lines, margin, 38);

    doc.save(`chamsa-resposta-${Date.now()}.pdf`);
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
        max-w-[90%] sm:max-w-[80%] group relative
        ${isAssistant
          ? 'bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3'
          : 'bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-3'
        }
      `}>
        {isAssistant ? (
          <div className="chamsa-prose text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}

        {isAssistant && message.searchPrompt && (
          <SearchSuggestion query={message.searchPrompt} />
        )}

        {/* Actions */}
        {isAssistant && (
          <div className="mt-3 space-y-2">
            {/* Retry without canvas */}
            {onRetryWithoutCanvas && (
              <button
                onClick={onRetryWithoutCanvas}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors"
              >
                <LayoutPanelLeft className="w-3 h-3" />
                Tentar novamente sem a ferramenta Canvas
              </button>
            )}
            {/* Feedback row */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setLiked(liked === 'up' ? null : 'up')}
                className={`p-1 rounded-md transition-colors ${liked === 'up' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                title="Útil"
              >
                <ThumbsUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => setLiked(liked === 'down' ? null : 'down')}
                className={`p-1 rounded-md transition-colors ${liked === 'down' ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`}
                title="Não útil"
              >
                <ThumbsDown className="w-3 h-3" />
              </button>
              <button onClick={handleCopy} className="p-1 hover:bg-muted rounded-md transition-colors" title="Copiar">
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
              </button>
              <button onClick={handlePrintPDF} className="p-1 hover:bg-muted rounded-md transition-colors" title="Exportar PDF">
                <Printer className="w-3 h-3 text-muted-foreground" />
              </button>
              <button className="p-1 hover:bg-muted rounded-md transition-colors" title="Mais opções">
                <MoreHorizontal className="w-3 h-3 text-muted-foreground" />
              </button>
              <span className="text-[10px] text-muted-foreground/50 ml-1">All</span>
            </div>
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