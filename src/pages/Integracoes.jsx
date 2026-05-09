import React, { useState } from 'react';
import { Plus, Plug, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import IntegrationCard from '@/components/integracoes/IntegrationCard';
import AddIntegrationModal from '@/components/integracoes/AddIntegrationModal';

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

const KNOWN_CONFIGURED = ['groq']; // Secrets já definidos no backend

export default function Integracoes() {
  const [customProviders, setCustomProviders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('chamsa_custom_integrations') || '[]');
    } catch { return []; }
  });
  const [modalOpen, setModalOpen] = useState(false);

  const handleAddCustom = (provider) => {
    const updated = [...customProviders, provider];
    setCustomProviders(updated);
    localStorage.setItem('chamsa_custom_integrations', JSON.stringify(updated));
  };

  const handleRemoveCustom = (id) => {
    const updated = customProviders.filter(p => p.id !== id);
    setCustomProviders(updated);
    localStorage.setItem('chamsa_custom_integrations', JSON.stringify(updated));
  };

  const allProviders = [...BUILT_IN_PROVIDERS, ...customProviders];

  return (
    <div className="flex-1 overflow-y-auto">
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
          <Button size="sm" onClick={() => setModalOpen(true)} className="gap-1.5 shrink-0">
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </Button>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Status:</span>
          {KNOWN_CONFIGURED.map(id => {
            const p = BUILT_IN_PROVIDERS.find(b => b.id === id);
            return p ? (
              <span key={id} className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                {p.label}
              </span>
            ) : null;
          })}
          <span className="text-[10px] text-muted-foreground">
            {allProviders.length - KNOWN_CONFIGURED.length} sem configuração
          </span>
        </div>

        {/* Built-in integrations */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Provedores Padrão</p>
          <div className="space-y-2">
            {BUILT_IN_PROVIDERS.map(template => (
              <IntegrationCard
                key={template.id}
                template={template}
                existingSecret={KNOWN_CONFIGURED.includes(template.id)}
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
                  existingSecret={false}
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
    </div>
  );
}