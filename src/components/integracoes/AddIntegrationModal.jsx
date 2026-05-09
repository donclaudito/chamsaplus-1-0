import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = [
  { id: 'blue',   color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200'   },
  { id: 'rose',   color: 'text-rose-600',   bg: 'bg-rose-50',   border: 'border-rose-200'   },
  { id: 'teal',   color: 'text-teal-600',   bg: 'bg-teal-50',   border: 'border-teal-200'   },
  { id: 'amber',  color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200'  },
  { id: 'indigo', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { id: 'slate',  color: 'text-slate-600',  bg: 'bg-slate-50',  border: 'border-slate-200'  },
];

export default function AddIntegrationModal({ open, onClose, onAdd }) {
  const [form, setForm] = useState({
    label: '',
    secretName: '',
    baseUrl: 'https://',
    endpoint: '/endpoint',
    method: 'POST',
    authHeader: 'Bearer {API_KEY}',
    colorId: 'blue',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleAdd = () => {
    if (!form.label.trim()) return;
    const col = COLORS.find(c => c.id === form.colorId) || COLORS[0];
    onAdd({
      id: `custom_${Date.now()}`,
      label: form.label.trim(),
      secretName: form.secretName.trim(),
      baseUrl: form.baseUrl.trim(),
      endpoint: form.endpoint.trim(),
      method: form.method,
      authHeader: form.authHeader.trim(),
      exampleJson: { key: 'value' },
      color: col.color,
      bg: col.bg,
      border: col.border,
      isCustom: true,
    });
    setForm({ label: '', secretName: '', baseUrl: 'https://', endpoint: '/endpoint', method: 'POST', authHeader: 'Bearer {API_KEY}', colorId: 'blue' });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">Nova Integração</h2>
              <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Nome da integração *</label>
                <Input value={form.label} onChange={e => set('label', e.target.value)} placeholder="Ex: Mistral AI" className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Nome do Secret (API Key)</label>
                <Input value={form.secretName} onChange={e => set('secretName', e.target.value)} placeholder="Ex: MISTRAL_API_KEY" className="text-xs font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Base URL</label>
                  <Input value={form.baseUrl} onChange={e => set('baseUrl', e.target.value)} className="text-xs font-mono" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Endpoint</label>
                  <Input value={form.endpoint} onChange={e => set('endpoint', e.target.value)} className="text-xs font-mono" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Auth Header</label>
                <Input value={form.authHeader} onChange={e => set('authHeader', e.target.value)} className="text-xs font-mono" />
              </div>
              {/* Color picker */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Cor</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => set('colorId', c.id)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${c.bg} ${form.colorId === c.id ? 'border-primary scale-110' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
              <Button size="sm" onClick={handleAdd} disabled={!form.label.trim()} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}