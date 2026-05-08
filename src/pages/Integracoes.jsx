import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Check, X, Eye, EyeOff, Code2, Plug, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

const PROVIDER_TEMPLATES = [
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
      max_tokens: 256
    },
    endpoint: '/chat/completions',
    method: 'POST',
    authHeader: 'Bearer {API_KEY}'
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
      messages: [{ role: 'user', content: 'Hello!' }]
    },
    endpoint: '/messages',
    method: 'POST',
    authHeader: 'x-api-key: {API_KEY}'
  },
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
      max_tokens: 256
    },
    endpoint: '/chat/completions',
    method: 'POST',
    authHeader: 'Bearer {API_KEY}'
  },
  {
    id: 'custom',
    label: 'API Customizada',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    secretName: '',
    baseUrl: 'https://sua-api.com/v1',
    exampleJson: { key: 'value' },
    endpoint: '/endpoint',
    method: 'POST',
    authHeader: 'Bearer {API_KEY}'
  }
];

function JsonEditor({ value, onChange, readOnly = false }) {
  const [error, setError] = useState(null);
  const [raw, setRaw] = useState(typeof value === 'string' ? value : JSON.stringify(value, null, 2));

  useEffect(() => {
    setRaw(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
  }, [value]);

  const handleChange = (e) => {
    const txt = e.target.value;
    setRaw(txt);
    try {
      const parsed = JSON.parse(txt);
      setError(null);
      onChange && onChange(parsed);
    } catch {
      setError('JSON inválido');
    }
  };

  return (
    <div className="relative">
      <textarea
        readOnly={readOnly}
        value={raw}
        onChange={handleChange}
        className={`w-full font-mono text-xs rounded-lg border p-3 resize-none outline-none transition-colors leading-relaxed
          ${error ? 'border-red-400 bg-red-50' : 'border-border bg-muted/50 focus:border-primary'}
          ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}
        `}
        rows={8}
        spellCheck={false}
      />
      {error && (
        <p className="text-[10px] text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

function IntegrationCard({ template, existingSecret }) {
  const [expanded, setExpanded] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [customBody, setCustomBody] = useState(template.exampleJson);
  const [customUrl, setCustomUrl] = useState(template.baseUrl + template.endpoint);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saved, setSaved] = useState(false);

  const isConfigured = existingSecret || saved;

  const handleSave = () => {
    // Salva localmente (em produção, enviar ao backend para set_secrets)
    localStorage.setItem(`chamsa_apikey_${template.id}`, apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await base44.functions.invoke('testApiIntegration', {
        url: customUrl,
        method: template.method,
        body: customBody,
        secret_name: template.secretName,
        auth_header: template.authHeader,
      });
      setTestResult({ success: true, data: res.data });
    } catch (e) {
      setTestResult({ success: false, error: e.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <motion.div
      layout
      className={`border rounded-xl overflow-hidden transition-all ${template.border} ${expanded ? 'shadow-md' : 'shadow-sm hover:shadow-md'}`}
    >
      {/* Card Header */}
      <button
        className={`w-full flex items-center justify-between px-4 py-3.5 ${template.bg} transition-colors`}
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-white border ${template.border} flex items-center justify-center`}>
            <Plug className={`w-4 h-4 ${template.color}`} />
          </div>
          <div className="text-left">
            <p className={`text-sm font-semibold ${template.color}`}>{template.label}</p>
            <p className="text-[10px] text-muted-foreground font-mono">{template.secretName || 'API customizada'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConfigured
            ? <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">✓ Configurado</Badge>
            : <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-[10px]">Não configurado</Badge>
          }
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-white border-t border-border"
          >
            <div className="p-4 space-y-4">

              {/* API Key */}
              {template.secretName && (
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">
                    Chave de API <span className="font-mono text-muted-foreground">({template.secretName})</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder={`sk-... ou cole sua ${template.label} key`}
                        className="pr-9 font-mono text-xs"
                      />
                      <button
                        onClick={() => setShowKey(v => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <Button size="sm" onClick={handleSave} className="shrink-0">
                      {saved ? <Check className="w-3.5 h-3.5" /> : 'Salvar'}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    ⚠️ Para uso em produção, defina a variável <code className="bg-muted px-1 rounded">{template.secretName}</code> nas configurações de Secrets do dashboard.
                  </p>
                </div>
              )}

              {/* Endpoint URL */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">URL do Endpoint</label>
                <Input
                  value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              {/* Auth Header */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Header de Autenticação</label>
                <code className="block bg-muted rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground">
                  Authorization: {template.authHeader}
                </code>
              </div>

              {/* JSON Body */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Code2 className="w-3.5 h-3.5 text-primary" />
                  <label className="text-xs font-semibold text-foreground">Corpo da Requisição (JSON)</label>
                </div>
                <JsonEditor value={customBody} onChange={setCustomBody} />
              </div>

              {/* Test Button */}
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTest}
                  disabled={testing}
                  className="gap-2"
                >
                  {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plug className="w-3.5 h-3.5" />}
                  {testing ? 'Testando...' : 'Testar Conexão'}
                </Button>
              </div>

              {/* Test Result */}
              {testResult && (
                <div className={`rounded-lg p-3 text-xs font-mono ${testResult.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-semibold mb-1 ${testResult.success ? 'text-emerald-700' : 'text-red-700'}`}>
                    {testResult.success ? '✓ Conexão bem-sucedida' : '✗ Erro na conexão'}
                  </p>
                  <pre className="overflow-auto max-h-32 text-[10px] whitespace-pre-wrap">
                    {testResult.success
                      ? JSON.stringify(testResult.data, null, 2)
                      : testResult.error
                    }
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Integracoes() {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Plug className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Integrações de API</h1>
              <p className="text-xs text-muted-foreground">Configure provedores externos e teste requisições JSON</p>
            </div>
          </div>
        </div>

        {/* Integration Cards */}
        <div className="space-y-3">
          {PROVIDER_TEMPLATES.map(template => (
            <IntegrationCard
              key={template.id}
              template={template}
              existingSecret={template.id === 'groq'} // GROQ já está configurada
            />
          ))}
        </div>

        {/* Info Box */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-primary">💡 Como funciona</p>
          <p>• As <strong>API Keys</strong> devem ser salvas como Secrets no dashboard (painel do desenvolvedor).</p>
          <p>• O campo <strong>JSON</strong> define o corpo da requisição enviada ao provedor.</p>
          <p>• O botão <strong>Testar Conexão</strong> invoca uma função backend segura que nunca expõe a chave no frontend.</p>
        </div>
      </div>
    </div>
  );
}