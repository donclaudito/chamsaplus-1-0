import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const DEFAULT_FORM = {
  label: '',
  baseUrl: '',
  apiKey: '',
  model_id: '',
  max_tokens: 2048,
  endpoint: '/chat/completions',
  method: 'POST',
  secretName: '',
};

export default function AddLLMPlatformForm({ open, onClose }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const mutation = useMutation({
    mutationFn: async (data) => {
      // Salvar a API key via função de backend segura
      if (data.apiKey && data.secretName) {
        await base44.functions.invoke('saveApiKey', {
          secretName: data.secretName,
          apiKey: data.apiKey,
        });
      }

      // Montar exampleJson padrão com o modelo e max_tokens
      const exampleJson = JSON.stringify({
        model: data.model_id,
        messages: [{ role: 'user', content: 'Hello!' }],
        max_tokens: Number(data.max_tokens),
      });

      // Criar integração customizada via backend (service role)
      await base44.functions.invoke('saveCustomIntegration', {
        label: data.label,
        baseUrl: data.baseUrl,
        endpoint: data.endpoint,
        method: data.method,
        secretName: data.secretName,
        authHeader: `Bearer {API_KEY}`,
        exampleJson,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
        border: 'border-violet-200',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customIntegrations'] });
      setForm(DEFAULT_FORM);
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
    if (!form.label || !form.baseUrl || !form.model_id) {
      setError('Preencha os campos obrigatórios: Nome, URL Base e ID do Modelo.');
      return;
    }
    mutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Plataforma LLM</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Nome do Provedor <span className="text-destructive">*</span></Label>
            <Input
              placeholder="ex: OpenAI, Anthropic, Mistral"
              value={form.label}
              onChange={e => set('label', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>URL Base da API <span className="text-destructive">*</span></Label>
            <Input
              placeholder="ex: https://api.openai.com/v1"
              value={form.baseUrl}
              onChange={e => set('baseUrl', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>ID do Modelo Padrão <span className="text-destructive">*</span></Label>
            <Input
              placeholder="ex: gpt-4o-mini, claude-3-haiku"
              value={form.model_id}
              onChange={e => set('model_id', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Max Tokens Padrão</Label>
            <Input
              type="number"
              min={128}
              max={32768}
              value={form.max_tokens}
              onChange={e => set('max_tokens', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Nome do Secret (variável de ambiente)</Label>
            <Input
              placeholder="ex: MINHA_API_KEY"
              value={form.secretName}
              onChange={e => set('secretName', e.target.value.toUpperCase().replace(/\s/g, '_'))}
            />
            <p className="text-[10px] text-muted-foreground">
              Configure este secret no painel do desenvolvedor → Secrets.
            </p>
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

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Salvando...</>
              ) : 'Salvar Plataforma'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}