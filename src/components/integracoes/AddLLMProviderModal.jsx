import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ExternalLink, Star, Zap } from 'lucide-react';
import { LLM_PROVIDERS } from './LLMProviderRegistry';

const EMPTY_FORM = {
  providerId: '',
  label: '',
  baseUrl: '',
  endpoint: '/chat/completions',
  apiKey: '',
  model_id: '',
  max_tokens: 2048,
  color: 'text-violet-600',
  bg: 'bg-violet-50',
  border: 'border-violet-200',
};

export default function AddLLMProviderModal({ open, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [error, setError] = useState('');
  const qc = useQueryClient();

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleProviderSelect = (providerId) => {
    const provider = LLM_PROVIDERS.find(p => p.id === providerId);
    if (!provider) return;
    setSelectedProvider(provider);
    setForm({
      providerId,
      label: provider.label,
      baseUrl: provider.baseUrl,
      endpoint: provider.endpoint,
      apiKey: '',
      model_id: provider.model_id,
      max_tokens: provider.max_tokens,
      color: provider.color,
      bg: provider.bg,
      border: provider.border,
    });
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      const secretName = `LLM_KEY_${data.label.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;

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
        baseUrl: data.baseUrl,
        endpoint: data.endpoint,
        method: 'POST',
        secretName: data.apiKey ? secretName : '',
        authHeader: 'Bearer {API_KEY}',
        exampleJson,
        color: data.color,
        bg: data.bg,
        border: data.border,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plataformasLLM'] });
      qc.invalidateQueries({ queryKey: ['customIntegrations'] });
      setForm(EMPTY_FORM);
      setSelectedProvider(null);
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
    if (!form.label || !form.model_id) {
      setError('Selecione um provedor e preencha o ID do modelo.');
      return;
    }
    mutation.mutate(form);
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setSelectedProvider(null);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Plataforma LLM</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">

          {/* Provider selector */}
          <div className="space-y-1.5">
            <Label>Provedor <span className="text-destructive">*</span></Label>
            <Select value={form.providerId} onValueChange={handleProviderSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um provedor..." />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {LLM_PROVIDERS.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <span>{p.label}</span>
                      {p.free === true && (
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">FREE</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Provider info badge */}
          {selectedProvider && (
            <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${selectedProvider.bg} ${selectedProvider.border}`}>
              <div className="flex items-center gap-2">
                {selectedProvider.free === true && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                    <Zap className="w-3 h-3" /> Gratuito
                  </span>
                )}
                {selectedProvider.free === false && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                    <Star className="w-3 h-3" /> Pago
                  </span>
                )}
                {selectedProvider.id === 'ollama' && (
                  <span className="text-[10px] text-muted-foreground">Execução local — sem chave de API necessária</span>
                )}
              </div>
              {selectedProvider.docs && (
                <a
                  href={selectedProvider.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1 text-[10px] font-medium underline underline-offset-2 ${selectedProvider.color}`}
                >
                  Docs <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Base URL */}
          <div className="space-y-1.5">
            <Label>URL Base</Label>
            <Input
              placeholder="https://api.exemplo.com/v1"
              value={form.baseUrl}
              onChange={e => set('baseUrl', e.target.value)}
            />
          </div>

          {/* Endpoint */}
          <div className="space-y-1.5">
            <Label>Endpoint</Label>
            <Input
              placeholder="/chat/completions"
              value={form.endpoint}
              onChange={e => set('endpoint', e.target.value)}
            />
          </div>

          {/* Model ID with suggestions */}
          <div className="space-y-1.5">
            <Label>ID do Modelo <span className="text-destructive">*</span></Label>
            {selectedProvider?.models?.length > 0 ? (
              <Select value={form.model_id} onValueChange={v => set('model_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um modelo..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedProvider.models.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="ex: gpt-4o-mini"
                value={form.model_id}
                onChange={e => set('model_id', e.target.value)}
              />
            )}
          </div>

          {/* Max Tokens */}
          <div className="space-y-1.5">
            <Label>Max Tokens</Label>
            <Input
              type="number"
              min={128}
              max={131072}
              value={form.max_tokens}
              onChange={e => set('max_tokens', e.target.value)}
            />
          </div>

          {/* API Key — hidden for local providers */}
          {form.providerId !== 'ollama' && (
            <div className="space-y-1.5">
              <Label>Chave de API</Label>
              <Input
                type="password"
                placeholder="sk-... ou token de acesso"
                value={form.apiKey}
                onChange={e => set('apiKey', e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Armazenada com segurança via backend — nunca exposta no frontend.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={handleClose} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending || !form.providerId}>
              {mutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Salvando...</>
                : 'Salvar Plataforma'}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}