import React, { useState, useEffect } from 'react';
import { Beaker, Brain, Shield, Zap, History, Activity, CheckCircle2, Sparkles, Palette, LayoutGrid } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import LLMConsumoDashboard from '@/components/laboratorio/LLMConsumoDashboard';
import CollapsiblePanel from '@/components/laboratorio/CollapsiblePanel';
import ThemeSelector from '@/components/laboratorio/ThemeSelector';
import ComponentShowcase from '@/components/laboratorio/ComponentShowcase';
import SkillsPanel from '@/components/laboratorio/SkillsPanel';

const skills = [
  { label: 'Deep Reasoning', desc: 'Protocolo CoT (Chain-of-Thought)', icon: Brain, color: 'text-purple-600', bg: 'bg-purple-500/10' },
  { label: 'Grounding Estrito', desc: 'Zero Hallucination Protocol', icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  { label: 'Rastreabilidade', desc: 'Citações obrigatórias de fontes', icon: History, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'ReAct Clínico', desc: 'Ciclo Hipótese & Contraditório', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-500/10' },
];

const metrics = [
  { label: 'Acurácia', value: '99.8%', sub: 'Sincronizada', icon: Activity, color: 'text-emerald-600' },
  { label: 'RLHF', value: 'Ativo', sub: 'Aprendendo', icon: Sparkles, color: 'text-primary' },
  { label: 'Segurança', value: 'ON', sub: 'Modo Estrito', icon: Shield, color: 'text-amber-600' },
];

const tests = [
  { name: 'Stress Test: Protocolos', status: 'ready', desc: 'Validação de aderência aos protocolos clínicos.' },
  { name: 'Detecção de Hallucinação', status: 'active', desc: 'Monitoramento de integridade de dados.' },
  { name: 'Latência Neural', status: 'ready', desc: 'Otimização da velocidade de resposta.' },
];

// Theme CSS variable overrides applied to the lab container
const THEME_STYLES = {
  light: {},
  dark: {
    '--lab-bg': '#0f172a',
    '--lab-card': '#1e293b',
    '--lab-text': '#f1f5f9',
    '--lab-muted': '#64748b',
    '--lab-border': '#334155',
  },
  contrast: {
    '--lab-bg': '#000000',
    '--lab-card': '#111111',
    '--lab-text': '#facc15',
    '--lab-muted': '#a3a3a3',
    '--lab-border': '#facc15',
  },
};

const THEME_CLASSES = {
  light: 'bg-background text-foreground',
  dark: 'text-slate-100',
  contrast: 'text-yellow-400',
};

export default function Laboratorio() {
  const [theme, setTheme] = useState(() => localStorage.getItem('lab_theme') || 'light');

  useEffect(() => {
    localStorage.setItem('lab_theme', theme);
  }, [theme]);

  const themeStyle = THEME_STYLES[theme];
  const isDark = theme === 'dark';
  const isContrast = theme === 'contrast';

  const containerBg = isDark ? 'bg-slate-900' : isContrast ? 'bg-black' : '';
  const cardBg = isDark ? 'bg-slate-800 border-slate-700' : isContrast ? 'bg-neutral-900 border-yellow-500' : '';
  const textPrimary = isDark ? 'text-slate-100' : isContrast ? 'text-yellow-400' : 'text-foreground';
  const textMuted = isDark ? 'text-slate-400' : isContrast ? 'text-yellow-200/70' : 'text-muted-foreground';

  // Inject a small override class to child components
  const panelOverride = isDark
    ? '[&_.rounded-2xl]:bg-slate-800 [&_.rounded-2xl]:border-slate-700 [&_.rounded-2xl>button]:hover:bg-slate-700 [&_.bg-card]:bg-slate-800 [&_.border-border]:border-slate-700'
    : isContrast
    ? '[&_.rounded-2xl]:bg-neutral-900 [&_.rounded-2xl]:border-yellow-500 [&_.bg-card]:bg-neutral-900 [&_.border-border]:border-yellow-500'
    : '';

  return (
    <div className={`h-full overflow-y-auto p-4 sm:p-6 transition-colors duration-300 ${containerBg}`}>
      <div className={`max-w-4xl mx-auto ${panelOverride}`}>

        {/* Header */}
        <motion.div
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className={`text-xl sm:text-2xl font-bold flex items-center gap-3 ${textPrimary}`}>
            <Beaker className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
            Laboratório IA
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${textMuted}`}>
            Monitoramento neural e métricas de performance da Chamsa Isa
          </p>
        </motion.div>

        <div className="space-y-5">

          {/* PAINEL 1 — Tema */}
          <CollapsiblePanel title="Temas da Interface" icon={Palette} iconColor="text-pink-500" badge="design" defaultOpen={true}>
            <p className={`text-xs mb-4 ${textMuted}`}>Personalize a aparência visual do Laboratório em tempo real.</p>
            <ThemeSelector activeTheme={theme} onChange={setTheme} />
            <div className={`mt-4 flex gap-3 text-xs ${textMuted}`}>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-white border border-slate-300 inline-block" /> Claro
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-900 border border-slate-600 inline-block" /> Escuro
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-black border border-yellow-400 inline-block" /> Alto Contraste (acessibilidade)
              </span>
            </div>
          </CollapsiblePanel>

          {/* PAINEL 2 — Componentes visuais */}
          <CollapsiblePanel title="Biblioteca de Componentes" icon={LayoutGrid} iconColor="text-blue-500" badge="UI kit" defaultOpen={true}>
            <p className={`text-xs mb-4 ${textMuted}`}>Pré-visualização e código dos componentes reutilizáveis do sistema.</p>
            <ComponentShowcase />
          </CollapsiblePanel>

          {/* PAINEL — Skills da Chamsa Isa */}
          <CollapsiblePanel title="Skills da Chamsa Isa" icon={Zap} iconColor="text-yellow-500" badge="injeção de prompt" defaultOpen={true}>
            <p className={`text-xs mb-4 ${textMuted}`}>
              Crie e gerencie diretivas personalizadas que são injetadas automaticamente no system prompt da Chamsa em cada sessão de chat.
            </p>
            <SkillsPanel />
          </CollapsiblePanel>

          {/* PAINEL 3 — Consumo LLM */}
          <CollapsiblePanel title="Consumo LLM — Dia / Mês" icon={Activity} iconColor="text-emerald-500" defaultOpen={true}>
            <LLMConsumoDashboard />
          </CollapsiblePanel>

          {/* PAINEL 4 — Métricas */}
          <CollapsiblePanel title="Métricas de Performance" icon={Sparkles} iconColor="text-amber-500" defaultOpen={false}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {metrics.map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`p-5 rounded-xl border ${cardBg || 'bg-card border-border'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>{m.label}</span>
                    <m.icon className={`w-4 h-4 ${m.color}`} />
                  </div>
                  <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
                  <p className={`text-xs mt-1 ${textMuted}`}>{m.sub}</p>
                </motion.div>
              ))}
            </div>
          </CollapsiblePanel>

          {/* PAINEL 5 — Skills */}
          <CollapsiblePanel title="Skills de Elite Ativas" icon={Brain} iconColor="text-purple-500" defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {skills.map((skill, i) => (
                <motion.div
                  key={skill.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`flex items-start gap-3 p-4 rounded-xl ${skill.bg}`}
                >
                  <skill.icon className={`w-5 h-5 ${skill.color} shrink-0 mt-0.5`} />
                  <div>
                    <h4 className={`text-sm font-semibold ${skill.color}`}>{skill.label}</h4>
                    <p className={`text-xs mt-0.5 ${textMuted}`}>{skill.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CollapsiblePanel>

          {/* PAINEL 6 — Diagnóstico */}
          <CollapsiblePanel title="Ferramentas de Diagnóstico" icon={Shield} iconColor="text-rose-500" defaultOpen={false}>
            <div className="space-y-3">
              {tests.map(test => (
                <div key={test.name} className={`flex items-center justify-between p-4 rounded-xl border ${cardBg || 'bg-muted/50 border-border'}`}>
                  <div>
                    <h4 className={`text-sm font-semibold ${textPrimary}`}>{test.name}</h4>
                    <p className={`text-xs mt-0.5 ${textMuted}`}>{test.desc}</p>
                  </div>
                  <Badge variant={test.status === 'active' ? 'default' : 'secondary'}>
                    {test.status === 'active' ? (
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ativo</span>
                    ) : 'Pronto'}
                  </Badge>
                </div>
              ))}
            </div>
          </CollapsiblePanel>

        </div>
      </div>
    </div>
  );
}