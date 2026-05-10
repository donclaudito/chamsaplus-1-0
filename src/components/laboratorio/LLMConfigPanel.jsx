import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, CheckCircle2, Eye, EyeOff, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PROVIDERS = [
  { id: 'openai',     label: 'OpenAI',        placeholder: 'sk-...',       models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'], baseUrl: '' },
  { id: 'anthropic',  label: 'Anthropic',     placeholder: 'sk-ant-...',   models: ['claude-3-5-sonnet-20241022', 'claude-3-7-sonnet-20250219', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'], baseUrl: '' },
  { id: 'groq',       label: 'Groq',          placeholder: 'gsk_...',      models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'moonshotai/kimi-k2-instruct', 'deepseek-r1-distill-llama-70b', 'gemma2-9b-it'], baseUrl: '' },
  { id: 'google',     label: 'Google Gemini', placeholder: 'AIza...',      models: ['gemini-2.0-flash', 'gemini-2.5-pro-preview-05-06', 'gemini-1.5-pro', 'gemini-1.5-flash'], baseUrl: '' },
  { id: 'mistral',    label: 'Mistral',       placeholder: '...',          models: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest', 'open-mixtral-8x22b'], baseUrl: '' },
  { id: 'deepseek',   label: 'DeepSeek',      placeholder: 'sk-...',       models: ['deepseek-chat', 'deepseek-reasoner'], baseUrl: 'https://api.deepseek.com/v1/chat/completions' },
  { id: 'xai',        label: 'xAI (Grok)',    placeholder: 'xai-...',      models: ['grok-3', 'grok-3-mini', 'grok-2-1212'], baseUrl: 'https://api.x.ai/v1/chat/completions' },
  { id: 'cohere',     label: 'Cohere',        placeholder: '...',          models: ['command-r-plus-08-2024', 'command-r-08-2024', 'command-light'], baseUrl: '' },
  { id: 'perplexity', label: 'Perplexity',    placeholder: 'pplx-...',     models: ['sonar-pro', 'sonar', 'sonar-reasoning-pro'], baseUrl: 'https://api.perplexity.ai/chat/completions' },
  { id: 'together',   label: 'Together AI',   placeholder: '...',          models: ['meta-llama/Llama-3-70b-chat-hf', 'mistralai/Mixtral-8x22B-Instruct-v0.1', 'Qwen/Qwen2.5-72B-Instruct-Turbo'], baseUrl: '' },
  { id: 'ollama',     label: 'Ollama (local)', placeholder: '(não requerida)', models: ['llama3.2', 'llama3.1', 'mistral', 'qwen2.5', 'phi4'], baseUrl: 'http://localhost:11434/v1/chat/completions' },
];

const EMPTY_FORM = { provider: 'openai', model_id: '', model_label: '', api_key_encrypted: '', max_tokens: 2048, temperature: 0.3, base_url: '' };

function ConfigCard({ cfg, onToggle, onDelete, isDeleting }) {
  const [showKey, setShowKey] = useState(false);
  const provider = PROVIDERS.find(p => p.id === cfg.provider);

  return (
    <div className={`p-4 rounded-xl border transition-all ${cfg.is_active ? 'border-emerald-400 bg-emerald-50' : 'border-border bg-card'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-bold text-foreground">{cfg.model_label || cfg.model_id}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
              {provider?.label || cfg.provider}
            </span>
            {cfg.is_active && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> ATIVO
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
            <span>{showKey ? cfg.api_key_encrypted : (cfg.api_key_encrypted?.slice(0, 8) + '••••••••')}</span>
            <button onClick={() => setShowKey(v => !v)} className="ml-1 p-0.5 hover:text-foreground">
              {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          </div>
          <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
            <span>Max tokens: {cfg.max_tokens || 2048}</span>
            <span>Temp: {cfg.temperature ?? 0.3}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!cfg.is_active && (
            <Button size="sm" variant="outline" onClick={() => onToggle(cfg)} className="h-7 text-xs gap-1">
              <Zap className="w-3 h-3" /> Ativar
            </Button>
          )}
          {cfg.is_active && (
            <Button size="sm" variant="outline" onClick={() => onToggle(cfg)} className="h-7 text-xs text-muted-foreground">
              Desativar
            </Button>
          )}
          <button
            onClick={() => onDelete(cfg.id)}
            disabled={isDeleting}
            className="p-1.5 rounded-lg hover:bg-red-100 hover:text-red-500 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LLMConfigPanel() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [providerSearch, setProviderSearch] = useState('');
  const [testStatus, setTestStatus] = useState(null); // null | 'testing' | 'ok' | 'error'
  const [testMsg, setTestMsg] = useState('');

  const { data: configs = [] } = useQuery({
    queryKey: ['userLLMConfigs'],
    queryFn: () => base44.entities.UserLLMConfig.list('-created_date', 20),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const cfg = await base44.entities.UserLLMConfig.create(data);
      // Sync to CustomPlatform so it shows up in ModelSelector
      const providerLabel = PROVIDERS.find(p => p.id === data.provider)?.label || data.provider;
      await base44.entities.CustomPlatform.create({
        name: providerLabel,
        plans: [{ label: data.model_label || data.model_id, model_id: data.model_id, description: `via ${providerLabel}`, credits: '' }],
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/30',
        is_active: true,
        _user_llm_config_id: cfg.id,
      });
      return cfg;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['userLLMConfigs'] }); qc.invalidateQueries({ queryKey: ['customPlatforms'] }); setShowForm(false); setForm(EMPTY_FORM); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserLLMConfig.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['userLLMConfigs'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      // Remove linked CustomPlatform too
      const platforms = await base44.entities.CustomPlatform.filter({ _user_llm_config_id: id });
      await Promise.all(platforms.map(p => base44.entities.CustomPlatform.delete(p.id)));
      return base44.entities.UserLLMConfig.delete(id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['userLLMConfigs'] }); qc.invalidateQueries({ queryKey: ['customPlatforms'] }); },
  });

  const handleToggle = async (cfg) => {
    // Deactivate all first, then activate the chosen one (or just deactivate)
    const isActivating = !cfg.is_active;
    for (const c of configs) {
      if (c.id !== cfg.id && c.is_active) {
        await updateMutation.mutateAsync({ id: c.id, data: { is_active: false } });
      }
    }
    updateMutation.mutate({ id: cfg.id, data: { is_active: isActivating } });
  };

  const handleSave = () => {
    if (!form.api_key_encrypted || !form.model_id) return;
    const label = form.model_label || form.model_id;
    createMutation.mutate({ ...form, model_label: label });
  };

  const handleTest = async () => {
    if (!form.api_key_encrypted || !form.model_id) {
      setTestStatus('error');
      setTestMsg('Preencha a chave e o modelo antes de testar.');
      return;
    }
    setTestStatus('testing');
    setTestMsg('');
    // Save temporarily just to test via backend
    try {
      const tmp = await base44.entities.UserLLMConfig.create({ ...form, model_label: form.model_label || form.model_id, is_active: true });
      // Deactivate others
      for (const c of configs) {
        if (c.is_active) await base44.entities.UserLLMConfig.update(c.id, { is_active: false });
      }
      const res = await base44.functions.invoke('invokeCustomLLM', {
        messages: [
          { role: 'system', content: 'Você é um assistente de teste.' },
          { role: 'user', content: 'Responda apenas: OK' }
        ]
      });
      // Delete temp config
      await base44.entities.UserLLMConfig.delete(tmp.id);
      qc.invalidateQueries({ queryKey: ['userLLMConfigs'] });
      if (res.data?.content) {
        setTestStatus('ok');
        setTestMsg(`✅ Conexão OK! Resposta: "${res.data.content.slice(0, 60)}"`);
      } else {
        setTestStatus('error');
        setTestMsg('Resposta inesperada da API.');
      }
    } catch (e) {
      setTestStatus('error');
      setTestMsg(`❌ Erro: ${e.message}`);
    }
  };

  const selectedProvider = PROVIDERS.find(p => p.id === form.provider);
  const activeConfig = configs.find(c => c.is_active);

  return (
    <div>
      {/* Status */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          {activeConfig ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              LLM próprio ativo: {activeConfig.model_label || activeConfig.model_id}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Nenhum LLM próprio ativo — usando padrão Chamsa</span>
          )}
        </div>
        <Button size="sm" onClick={() => setShowForm(v => !v)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          {showForm ? 'Cancelar' : 'Adicionar API'}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-5 p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
          <h4 className="text-sm font-bold text-foreground">Nova Configuração de LLM</h4>

          {/* Provider */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Provedor</label>
            <input
              value={providerSearch}
              onChange={e => setProviderSearch(e.target.value)}
              placeholder="Filtrar provedores..."
              className="w-full mb-2 text-xs px-3 py-1.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {PROVIDERS.filter(p => p.label.toLowerCase().includes(providerSearch.toLowerCase())).map(p => (
                <button
                  key={p.id}
                  onClick={() => setForm(f => ({ ...f, provider: p.id, model_id: '', base_url: p.baseUrl || '' }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${form.provider === p.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Modelo</label>
            <select
              value={form.model_id}
              onChange={e => setForm(f => ({ ...f, model_id: e.target.value }))}
              className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            >
              <option value="">Selecione ou digite abaixo</option>
              {selectedProvider?.models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input
              value={form.model_id}
              onChange={e => setForm(f => ({ ...f, model_id: e.target.value }))}
              placeholder="Ou digite o ID do modelo manualmente..."
              className="w-full mt-1.5 text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Label */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nome amigável (opcional)</label>
            <input
              value={form.model_label}
              onChange={e => setForm(f => ({ ...f, model_label: e.target.value }))}
              placeholder="ex: Meu GPT-4o barato"
              className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Chave de API <span className="font-normal">({selectedProvider?.placeholder})</span>
            </label>
            <input
              type="password"
              value={form.api_key_encrypted}
              onChange={e => setForm(f => ({ ...f, api_key_encrypted: e.target.value }))}
              placeholder={selectedProvider?.placeholder || 'Cole sua API key aqui...'}
              className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground font-mono"
            />
          </div>

          {/* Advanced */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Max tokens</label>
              <input
                type="number"
                value={form.max_tokens}
                onChange={e => setForm(f => ({ ...f, max_tokens: Number(e.target.value) }))}
                className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Temperatura</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={form.temperature}
                onChange={e => setForm(f => ({ ...f, temperature: Number(e.target.value) }))}
                className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              />
            </div>
          </div>

          {selectedProvider?.baseUrl !== undefined && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Base URL {selectedProvider?.baseUrl ? '' : '(opcional — para proxies)'}
              </label>
              <input
                value={form.base_url}
                onChange={e => setForm(f => ({ ...f, base_url: e.target.value }))}
                placeholder={selectedProvider?.baseUrl || 'https://api.openai.com/v1/chat/completions'}
                className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground font-mono"
              />
              {selectedProvider?.baseUrl && !form.base_url && (
                <button
                  onClick={() => setForm(f => ({ ...f, base_url: selectedProvider.baseUrl }))}
                  className="mt-1 text-[10px] text-primary hover:underline"
                >
                  Usar padrão: {selectedProvider.baseUrl}
                </button>
              )}
            </div>
          )}

          {/* Test result */}
          {testStatus && (
            <div className={`flex items-start gap-2 text-xs p-2.5 rounded-lg ${testStatus === 'ok' ? 'bg-emerald-50 text-emerald-700' : testStatus === 'error' ? 'bg-red-50 text-red-700' : 'bg-muted text-muted-foreground'}`}>
              {testStatus === 'testing' ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 mt-0.5" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
              <span>{testStatus === 'testing' ? 'Testando conexão...' : testMsg}</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={handleTest} disabled={testStatus === 'testing'} className="gap-1.5">
              {testStatus === 'testing' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              Testar Conexão
            </Button>
            <Button size="sm" onClick={handleSave} disabled={createMutation.isPending} className="gap-1.5 flex-1">
              {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Salvar Configuração
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {configs.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
          <p className="text-2xl mb-2">🔑</p>
          <p className="text-sm font-medium text-foreground">Nenhuma API configurada</p>
          <p className="text-xs text-muted-foreground mt-1">Adicione sua chave para usar seu próprio LLM e economizar tokens</p>
        </div>
      ) : (
        <div className="space-y-2">
          {configs.map(cfg => (
            <ConfigCard
              key={cfg.id}
              cfg={cfg}
              onToggle={handleToggle}
              onDelete={(id) => deleteMutation.mutate(id)}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
        ⚠️ Sua chave de API é armazenada no banco de dados da aplicação associada ao seu usuário.
        Nunca compartilhe sua conta com terceiros. Para máxima segurança, use chaves com permissão mínima necessária.
      </p>
    </div>
  );
}