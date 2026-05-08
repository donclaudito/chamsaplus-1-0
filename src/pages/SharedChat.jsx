import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BrainCircuit, Bot, User, AlertCircle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { base44 } from '@/api/base44Client';

export default function SharedChat() {
  const { shareId } = useParams();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shareId) { setError('Link inválido.'); setLoading(false); return; }
    base44.entities.ChatSession.filter({ share_id: shareId, is_shared: true })
      .then(results => {
        if (results?.length > 0) setSession(results[0]);
        else setError('Conversa não encontrada ou o link expirou.');
      })
      .catch(() => setError('Erro ao carregar a conversa.'))
      .finally(() => setLoading(false));
  }, [shareId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    </div>
  );

  const visibleMessages = (session.messages || []).filter(m => m.role === 'user' || m.role === 'assistant');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <BrainCircuit className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-foreground">{session.title}</h1>
          <p className="text-[10px] text-muted-foreground">Chamsa Isa v4.1 · Conversa compartilhada</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {visibleMessages.map((msg, i) => {
            const isAssistant = msg.role === 'assistant';
            return (
              <div key={i} className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                {isAssistant && (
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] ${isAssistant
                  ? 'bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3'
                  : 'bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-3'
                }`}>
                  {isAssistant ? (
                    <div className="chamsa-prose text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}
                  <span className="text-[10px] text-muted-foreground/50 mt-1 block">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                {!isAssistant && (
                  <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-card/50 px-4 py-3 text-center">
        <p className="text-[11px] text-muted-foreground">
          Criado com <span className="font-semibold text-primary">Chamsa Isa</span> · Estrategista Clínica de Elite
        </p>
      </div>
    </div>
  );
}