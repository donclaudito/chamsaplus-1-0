import React, { useState } from 'react';
import { X, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function PasteDataModal({ open, onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) return;
    const finalTitle = title.trim() || `Laudo_Clinico_${new Date().getHours()}h${new Date().getMinutes()}`;
    onSubmit(finalTitle, content.trim());
    setTitle('');
    setContent('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Injetar Dados Clínicos
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Título (opcional)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Hemograma Completo 07/05"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Dados / Laudo</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Cole aqui os resultados de exames, laudos, dados clínicos..."
              className="min-h-[200px] font-mono text-xs"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!content.trim()}>
              Injetar na Sessão
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}