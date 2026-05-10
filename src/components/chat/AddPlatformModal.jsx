import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

const COLOR_OPTIONS = [
  { label: 'Rosa',    color: 'text-pink-400',    bg: 'bg-pink-500/10',    border: 'border-pink-500/30' },
  { label: 'Roxo',   color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30' },
  { label: 'Âmbar',  color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30' },
  { label: 'Ciano',  color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30' },
  { label: 'Lima',   color: 'text-lime-400',    bg: 'bg-lime-500/10',    border: 'border-lime-500/30' },
  { label: 'Índigo', color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/30' },
];

const emptyPlan = () => ({ label: '', model_id: '', description: '', credits: '' });

export default function AddPlatformModal({ open, onClose, onAdded }) {
  const [name, setName] = useState('');
  const [colorIdx, setColorIdx] = useState(0);
  const [plans, setPlans] = useState([emptyPlan()]);
  const [saving, setSaving] = useState(false);

  const handlePlanChange = (i, field, value) => {
    setPlans(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  };

  const addPlan = () => setPlans(prev => [...prev, emptyPlan()]);
  const removePlan = (i) => setPlans(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const { color, bg, border } = COLOR_OPTIONS[colorIdx];
    const validPlans = plans.filter(p => p.label.trim() && p.model_id.trim());
    await base44.entities.CustomPlatform.create({
      name: name.trim(),
      color, bg, border,
      plans: validPlans,
      is_active: true,
    });
    setSaving(false);
    onAdded();
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setColorIdx(0);
    setPlans([emptyPlan()]);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-5 overflow-y-auto max-h-[90vh]"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground">Nova Plataforma</h2>
            <button onClick={handleClose} className="p-1 hover:bg-muted rounded-lg">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
              Nome do Provedor
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Mistral AI, Together AI..."
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Color */}
          <div className="mb-4">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Cor
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setColorIdx(i)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${c.bg} ${c.border} ${c.color} ${colorIdx === i ? 'ring-2 ring-offset-1 ring-primary' : 'opacity-60 hover:opacity-100'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Plans */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Planos / Modelos
              </label>
              <button onClick={addPlan} className="flex items-center gap-1 text-[11px] text-primary hover:underline">
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </div>
            <div className="space-y-3">
              {plans.map((plan, i) => (
                <div key={i} className="bg-muted/50 border border-border rounded-xl p-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={plan.label}
                      onChange={e => handlePlanChange(i, 'label', e.target.value)}
                      placeholder="Label (ex: Fast)"
                      className="flex-1 bg-card border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/40"
                    />
                    <input
                      value={plan.model_id}
                      onChange={e => handlePlanChange(i, 'model_id', e.target.value)}
                      placeholder="Model ID (ex: mistral-small)"
                      className="flex-1 bg-card border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/40"
                    />
                    {plans.length > 1 && (
                      <button onClick={() => removePlan(i)} className="p-1 hover:text-destructive text-muted-foreground">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <input
                    value={plan.description}
                    onChange={e => handlePlanChange(i, 'description', e.target.value)}
                    placeholder="Descrição (opcional)"
                    className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  <input
                    value={plan.credits}
                    onChange={e => handlePlanChange(i, 'credits', e.target.value)}
                    placeholder="Custo (ex: ↓ Custo baixo)"
                    className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button onClick={handleClose} className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-lg transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              {saving ? 'Salvando...' : 'Salvar Plataforma'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}