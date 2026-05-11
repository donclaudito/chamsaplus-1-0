import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, AlertCircle, RotateCcw } from 'lucide-react';

const DEFAULT = {
  label: '',
  endpoint: '/chat/completions',
  apiKey: '',
  model_id: '',
  max_tokens: 2048,
};

export default function AddLLMPlatformModal({ open, onClose }) {
  const [form, setForm] = useState(DEFAULT);
  const [error, setError] = useState('');
  const qc = useQueryClient();

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const mutation = useMutation({
    mutationFn: async (data) => {
      const secretName = `LLM_KEY_${data.label.toUpperCase().replace(/\s+/g, '_')}`;

      if (data.apiKey) {
        await base44.functions.invoke('saveApiKey', {
          secretName,
          apiKey: data.apiKey,
        });
      }

      const exampleJson = JSON.stringify({
        model: data.model_id,
        messages: [{ role: 'user', content: 'Hello!' }],
        max_tokens: Number(data.max_tokens),
      });

      await base44.functions.invoke('saveCustomIntegration', {
        label: data.label,
        baseUrl: '',
        endpoint: data.endpoint,
        method: 'POST',
        secretName,
        authHeader: 'Bearer {API_KEY}',
        exampleJson,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
        border: 'border-violet-200',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plataformasLLM'] });
      qc.invalidateQueries({ queryKey: ['customIntegrations'] });
      setForm(DEFAULT);
      setError('');
      onClose();
    },
    onError: (err) => {
      setError(err.message || 'Erro ao salvar plataforma.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.label || !form.model_id || !form.endpoint) {
      setError('Preencha os campos obrigatórios: Provedor, Endpoint e ID do Modelo.');
      return;
    }
    mutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Plataforma LLM</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">

          <div className="space-y-1.5">
            <Label>Provedor <span className="text-destructive">*</span></Label>
            <Input
              placeholder="ex: OpenAI, Anthropic, Groq"
              value={form.label}
              onChange={e => set('label', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Endpoint <span className="text-destructive">*</span></Label>
            <Input
              placeholder="ex: https://api.openai.com/v1/chat/completions"
              value={form.endpoint}
              onChange={e => set('endpoint', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Chave de API</Label>
            <Input
              type="password"
              placeholder="sk-..."
              value={form.apiKey}
              onChange={e => set('apiKey', e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Salva com segurança via backend — nunca exposta no frontend.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>ID do Modelo <span className="text-destructive">*</span></Label>
            <Input
              placeholder="ex: gpt-4o-mini, claude-3-haiku"
              value={form.model_id}
              onChange={e => set('model_id', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Max Tokens</Label>
            <Input
              type="number"
              min={128}
              max={32768}
              value={form.max_tokens}
              onChange={e => set('max_tokens', e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1">{error}</div>
              <button
                onClick={handleSubmit}
                className="ml-2 font-medium hover:underline shrink-0"
                aria-label="Tentar novamente"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Salvando...</>
                : 'Salvar'}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}