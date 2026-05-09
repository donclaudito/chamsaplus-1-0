import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Eye, EyeOff, Code2, Plug, RefreshCw, Check, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import JsonEditor from './JsonEditor';

export default function IntegrationCard({ template, existingSecret, onRemove, isCustom }) {
  const [expanded, setExpanded] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const parsedExample = typeof template.exampleJson === 'string'
    ? (() => { try { return JSON.parse(template.exampleJson); } catch { return { key: 'value' }; } })()
    : (template.exampleJson || { key: 'value' });
  const [customBody, setCustomBody] = useState(parsedExample);
  const [customUrl, setCustomUrl] = useState((template.baseUrl || '') + (template.endpoint || ''));
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saved, setSaved] = useState(false);

  const isConfigured = existingSecret || saved;

  const handleSave = () => {
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
    <div className={`border rounded-xl overflow-hidden transition-shadow ${template.border} ${expanded ? 'shadow-md' : 'shadow-sm hover:shadow-md'}`}>
      {/* Header */}
      <button
        className={`w-full flex items-center justify-between px-4 py-3.5 ${template.bg} transition-colors`}
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-white border ${template.border} flex items-center justify-center shrink-0`}>
            <Plug className={`w-4 h-4 ${template.color}`} />
          </div>
          <div className="text-left">
            <p className={`text-sm font-semibold ${template.color}`}>{template.label}</p>
            <p className="text-[10px] text-muted-foreground font-mono">{template.secretName || 'API customizada'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConfigured
            ? <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px]">✓ Ativo</Badge>
            : <Badge className="bg-slate-100 text-slate-400 border border-slate-200 text-[10px]">Inativo</Badge>
          }
          {onRemove && (
            <button
              onClick={e => { e.stopPropagation(); onRemove(); }}
              className="p-1 rounded-md hover:bg-red-100 transition-colors"
              title="Remover integração"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
            </button>
          )}
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="bg-white border-t border-border p-4 space-y-4">

              {/* API Key */}
              {template.secretName && (
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">
                    API Key <span className="font-mono text-muted-foreground text-[10px]">({template.secretName})</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder={`Cole sua chave de API`}
                        className="pr-9 font-mono text-xs"
                      />
                      <button
                        onClick={() => setShowKey(v => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <Button size="sm" onClick={handleSave} className="shrink-0 gap-1.5">
                      {saved ? <><Check className="w-3.5 h-3.5" /> Salvo</> : 'Salvar'}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                    ⚠️ Para produção, configure <code className="bg-muted px-1 rounded">{template.secretName}</code> no painel de Secrets do dashboard.
                  </p>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-dashed border-border" />

              {/* Endpoint */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">URL do Endpoint</label>
                <Input value={customUrl} onChange={e => setCustomUrl(e.target.value)} className="font-mono text-xs" />
              </div>

              {/* Auth */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Header de Autenticação</label>
                <div className="bg-muted rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground">
                  Authorization: {template.authHeader}
                </div>
              </div>

              {/* JSON Body */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Code2 className="w-3.5 h-3.5 text-primary" />
                  <label className="text-xs font-semibold text-foreground">Corpo da Requisição (JSON)</label>
                </div>
                <JsonEditor value={customBody} onChange={setCustomBody} />
              </div>

              {/* Test */}
              <div className="flex items-center gap-3">
                <Button size="sm" variant="outline" onClick={handleTest} disabled={testing} className="gap-2">
                  {testing
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testando...</>
                    : <><Plug className="w-3.5 h-3.5" /> Testar Conexão</>
                  }
                </Button>
              </div>

              {/* Result */}
              <AnimatePresence>
                {testResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={`rounded-lg p-3 text-xs font-mono border ${testResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}
                  >
                    <p className={`font-semibold mb-1 ${testResult.success ? 'text-emerald-700' : 'text-red-700'}`}>
                      {testResult.success ? '✓ Conexão OK' : '✗ Falha na conexão'}
                    </p>
                    <pre className="overflow-auto max-h-40 text-[10px] whitespace-pre-wrap">
                      {testResult.success ? JSON.stringify(testResult.data, null, 2) : testResult.error}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}