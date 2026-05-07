import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const COMPONENTS = [
  {
    name: 'Badge — Status',
    category: 'Feedback',
    code: `<Badge>Ativo</Badge>`,
    preview: () => (
      <div className="flex gap-2 flex-wrap">
        <Badge>Ativo</Badge>
        <Badge variant="secondary">Revisão</Badge>
        <Badge variant="destructive">Crítico</Badge>
        <Badge variant="outline">Pronto</Badge>
      </div>
    ),
  },
  {
    name: 'Botões',
    category: 'Ação',
    code: `<Button>Primário</Button>\n<Button variant="outline">Outline</Button>`,
    preview: () => (
      <div className="flex gap-2 flex-wrap">
        <Button size="sm">Primário</Button>
        <Button size="sm" variant="outline">Outline</Button>
        <Button size="sm" variant="ghost">Ghost</Button>
        <Button size="sm" variant="destructive">Deletar</Button>
      </div>
    ),
  },
  {
    name: 'Progress Bar',
    category: 'Dados',
    code: `<div style={{width:'72%'}} className="h-2 rounded-full bg-primary" />`,
    preview: () => (
      <div className="space-y-2">
        {[['Claude Sonnet', 72, '#8b5cf6'], ['Llama 3.3', 18, '#10b981'], ['GPT Mini', 10, '#3b82f6']].map(([label, pct, color]) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium" style={{ color }}>{label}</span>
              <span className="text-muted-foreground">{pct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    name: 'Métrica KPI',
    category: 'Dados',
    code: `<div className="p-4 rounded-xl bg-card border">\n  <p className="text-3xl font-bold">99.8%</p>\n  <p className="text-xs text-muted-foreground">Acurácia</p>\n</div>`,
    preview: () => (
      <div className="grid grid-cols-3 gap-3">
        {[['99.8%', 'Acurácia', 'text-emerald-600'], ['Ativo', 'RLHF', 'text-primary'], ['ON', 'Segurança', 'text-amber-600']].map(([val, lbl, color]) => (
          <div key={lbl} className="p-3 rounded-xl bg-muted/50 border border-border text-center">
            <p className={`text-xl font-bold ${color}`}>{val}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{lbl}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    name: 'Tag Skill',
    category: 'Visual',
    code: `<div className="flex gap-2">\n  <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">CoT</span>\n</div>`,
    preview: () => (
      <div className="flex gap-2 flex-wrap">
        {[['CoT', 'bg-purple-100 text-purple-700'], ['ReAct', 'bg-amber-100 text-amber-700'], ['Grounding', 'bg-emerald-100 text-emerald-700'], ['Citações', 'bg-blue-100 text-blue-700']].map(([label, cls]) => (
          <span key={label} className={`px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>{label}</span>
        ))}
      </div>
    ),
  },
];

function ComponentCard({ comp }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(comp.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden group">
      {/* Preview area */}
      <div className="p-5 bg-muted/30 min-h-[80px] flex items-center">
        <comp.preview />
      </div>
      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-border">
        <div>
          <p className="text-xs font-semibold text-foreground">{comp.name}</p>
          <p className="text-[10px] text-muted-foreground">{comp.category}</p>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          title="Copiar código"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
}

export default function ComponentShowcase() {
  const [filter, setFilter] = useState('Todos');
  const categories = ['Todos', ...Array.from(new Set(COMPONENTS.map(c => c.category)))];
  const filtered = filter === 'Todos' ? COMPONENTS : COMPONENTS.filter(c => c.category === filter);

  return (
    <div>
      {/* Category filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filter === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map(comp => (
          <ComponentCard key={comp.name} comp={comp} />
        ))}
      </div>
    </div>
  );
}