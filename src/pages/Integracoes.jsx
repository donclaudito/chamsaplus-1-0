import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Plug, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import IntegrationCard from '@/components/integracoes/IntegrationCard';
import AddIntegrationModal from '@/components/integracoes/AddIntegrationModal';
import AddLLMProviderModal from '@/components/integracoes/AddLLMProviderModal';
import SecretsStatusPanel from '@/components/integracoes/SecretsStatusPanel';

const BUILT_IN_PROVIDERS = [
  {
    id: 'groq',
    label: 'Groq',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    secretName: 'GROQ_API_KEY',
    baseUrl: 'https://api.groq.com/openai/v1',
    exampleJson: {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'Hello!' }],
      max_tokens: 256,
    },
    endpoint: '/chat/completions',
    method: 'POST',
    authHeader: 'Bearer {API_KEY}',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    secretName: 'OPENAI_API_KEY',
    baseUrl: 'https://api.openai.com/v1',
    exampleJson: {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Hello!' }],
      max_tokens: 256,
    },
    endpoint: '/chat/completions',
    method: 'POST',
    authHeader: 'Bearer {API_KEY}',
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    secretName: 'ANTHROPIC_API_KEY',
    baseUrl: 'https://api.anthropic.com/v1',
    exampleJson: {
      model: 'claude-3-haiku-20240307',
      max_tokens: 256,
      messages: [{ role: 'user', content: 'Hello!' }],
    },
    endpoint: '/messages',
    method: 'POST',
    authHeader: 'x-api-key: {API_KEY}',
  },
  {
    id: 'google',
    label: 'Google Gemini',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    secretName: 'GOOGLE_API_KEY',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    exampleJson: {
      contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
    },
    endpoint: '/models/gemini-1.5-flash:generateContent',
    method: 'POST',
    authHeader: 'Bearer {API_KEY}',
  },
  {
    id: 'mistral',
    label: 'Mistral AI',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    secretName: 'MISTRAL_API_KEY',
    baseUrl: 'https://api.mistral.ai/v1',
    exampleJson: {
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: 'Hello!' }],
    },
    endpoint: '/chat/completions',
    method: 'POST',
    authHeader: 'Bearer {API_KEY}',
  },
];

export default function Integracoes() {
  const [modalOpen, setModalOpen] = useState(false);
  const [llmFormOpen, setLlmFormOpen] = useState(false);
  const [configuredSecrets, setConfiguredSecrets] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.functions.invoke('listSecrets', {})
      .then(res => {
        const configured = (res.data.secrets || [])
          .filter(s => s.configured)
          .map(s => s.name);
        setConfiguredSecrets(configured);
      })
      .catch(() => {});
  }, []);

  const { data: customProviders = [] } = useQuery({
    queryKey: ['customIntegrations'],
    queryFn: () => base44.entities.CustomIntegration.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomIntegration.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customIntegrations'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomIntegration.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customIntegrations'] }),
  });

  const handleAddCustom = (provider) => {
    const { id: _id, isCustom: _ic, ...data } = provider;
    // Serializar exampleJson como string se for objeto
    if (data.exampleJson && typeof data.exampleJson === 'object') {
      data.exampleJson = JSON.stringify(data.exampleJson);
    }
    createMutation.mutate(data);
  };

  const handleRemoveCustom = (id) => deleteMutation.mutate(id);

  const allProviders = [...BUILT_IN_PROVIDERS, ...customProviders];

  return (
    <div className="relative h-full">
    <div className="absolute inset-0 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Plug className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">Integrações de API</h1>
              <p className="text-xs text-muted-foreground">Configure e teste provedores LLM externos</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setLlmFormOpen(true)} className="gap-1.5 shrink-0">
              <Plus className="w-3.5 h-3.5" />
              Nova Plataforma LLM
            </Button>
            <Button size="sm" onClick={() => setModalOpen(true)} className="gap-1.5 shrink-0">
              <Plus className="w-3.5 h-3.5" />
              Adicionar
            </Button>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Status:</span>
          {BUILT_IN_PROVIDERS.filter(p => configuredSecrets.includes(p.secretName)).map(p => (
            <span key={p.id} className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {p.label}
            </span>
          ))}
          <span className="text-[10px] text-muted-foreground">
            {allProviders.length - configuredSecrets.length} sem configuração
          </span>
        </div>

        {/* Secrets Status */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <SecretsStatusPanel />
        </div>

        {/* Built-in integrations */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Provedores Padrão</p>
          <div className="space-y-2">
            {BUILT_IN_PROVIDERS.map(template => (
              <IntegrationCard
                key={template.id}
                template={template}
                existingSecret={configuredSecrets.includes(template.secretName)}
              />
            ))}
          </div>
        </div>

        {/* Custom integrations */}
        {customProviders.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Integrações Customizadas</p>
            <div className="space-y-2">
              {customProviders.map(template => (
                <IntegrationCard
                  key={template.id}
                  template={template}
                  existingSecret={configuredSecrets.includes(template.secretName)}
                  onRemove={() => handleRemoveCustom(template.id)}
                  isCustom
                />
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="flex gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-muted-foreground">
            <p className="font-semibold text-primary text-[11px]">Como funciona</p>
            <p>• <strong>API Keys</strong> devem ser definidas como Secrets no painel do desenvolvedor.</p>
            <p>• O campo <strong>JSON</strong> define o corpo exato enviado ao provedor.</p>
            <p>• <strong>Testar Conexão</strong> usa uma função backend segura — a chave nunca vai ao frontend.</p>
          </div>
        </div>

      </div>

      <AddIntegrationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddCustom}
      />
      <AddLLMProviderModal
        open={llmFormOpen}
        onClose={() => setLlmFormOpen(false)}
      />
    </div>
    </div>
  );
}