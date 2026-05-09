import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ShieldCheck, ShieldX, RefreshCw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const PROVIDER_MAP = {
  GROQ_API_KEY: { label: 'Groq', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
  OPENAI_API_KEY: { label: 'OpenAI', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  ANTHROPIC_API_KEY: { label: 'Anthropic', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  GOOGLE_API_KEY: { label: 'Google Gemini', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  MISTRAL_API_KEY: { label: 'Mistral AI', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
};

export default function SecretsStatusPanel() {
  const [secrets, setSecrets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreviews, setShowPreviews] = useState({});

  const fetchSecrets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('listSecrets', {});
      setSecrets(res.data.secrets || []);
    } catch (e) {
      setError(e.message || 'Erro ao carregar secrets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSecrets(); }, []);

  const togglePreview = (name) => setShowPreviews(p => ({ ...p, [name]: !p[name] }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Status dos Secrets no Backend
        </p>
        <Button variant="ghost" size="sm" onClick={fetchSecrets} disabled={loading} className="h-7 px-2 gap-1.5">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-[10px]">Atualizar</span>
        </Button>
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error} — apenas admins podem visualizar secrets.
        </div>
      )}

      <div className="grid gap-2">
        <AnimatePresence>
          {loading && !secrets.length ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
            ))
          ) : (
            secrets.map((s) => {
              const meta = PROVIDER_MAP[s.name] || { label: s.name, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
              return (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border ${meta.bg} ${meta.border}`}
                >
                  <div className="flex items-center gap-3">
                    {s.configured
                      ? <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      : <ShieldX className="w-4 h-4 text-slate-300 shrink-0" />
                    }
                    <div>
                      <p className={`text-xs font-semibold ${meta.color}`}>{meta.label}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{s.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.configured ? (
                      <>
                        <span className="text-[10px] font-mono text-muted-foreground bg-white border border-border rounded-md px-2 py-0.5">
                          {showPreviews[s.name] ? s.preview : '••••••••••••'}
                        </span>
                        <button
                          onClick={() => togglePreview(s.name)}
                          className="p-1 hover:bg-white rounded-md transition-colors"
                          title="Mostrar/ocultar preview"
                        >
                          <Eye className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Ativo
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        Não configurado
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Para configurar um secret, acesse <strong>Dashboard → Código → Variáveis de Ambiente</strong> e adicione a chave desejada.
      </p>
    </div>
  );
}