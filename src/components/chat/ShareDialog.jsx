import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Link, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function generateShareId() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export default function ShareDialog({ open, onClose, chat }) {
  const [shareLink, setShareLink] = useState(chat?.share_id && chat?.is_shared
    ? `${window.location.origin}/share/${chat.share_id}`
    : null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const shareId = chat.share_id || generateShareId();
    await base44.entities.ChatSession.update(chat.id, { share_id: shareId, is_shared: true });
    const link = `${window.location.origin}/share/${shareId}`;
    setShareLink(link);
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    setLoading(true);
    await base44.entities.ChatSession.update(chat.id, { is_shared: false });
    setShareLink(null);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-4 h-4 text-primary" />
            Compartilhar conversa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Gere um link público para compartilhar esta conversa. Qualquer pessoa com o link poderá visualizá-la.
          </p>

          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs font-semibold text-foreground truncate">{chat?.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {(chat?.messages || []).filter(m => m.role === 'user' || m.role === 'assistant').length} mensagens
            </p>
          </div>

          {shareLink ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input value={shareLink} readOnly className="text-xs font-mono" />
                <Button size="icon" variant="outline" onClick={handleCopy} className="shrink-0">
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCopy} className="flex-1 gap-2">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado!' : 'Copiar link'}
                </Button>
                <Button variant="outline" onClick={handleRevoke} disabled={loading} className="text-destructive hover:text-destructive">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Revogar acesso'}
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={handleGenerate} disabled={loading} className="w-full gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
              {loading ? 'Gerando link...' : 'Gerar link público'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}