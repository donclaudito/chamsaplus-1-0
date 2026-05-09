import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  BrainCircuit, MessageSquare, BookOpen, Beaker, Plug, Search,
  ShieldCheck, Zap, BarChart2, Users, Lock, RefreshCw, Star,
  ChevronRight, FlaskConical, Database, Layers
} from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: MessageSquare,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
    title: 'Assistente de Chat Inteligente',
    items: [
      'Sessões persistentes com histórico, fixação e renomeação',
      'Modo Canvas para respostas estruturadas e editáveis',
      'Integração automática com PubMed para artigos científicos',
      'Colagem e análise contextual de dados clínicos',
    ],
  },
  {
    icon: BookOpen,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    title: 'Gestão do Conhecimento (Biblioteca)',
    items: [
      'Indexação de protocolos, laudos e pesquisas',
      'Pesquisa Semântica via RAG com Google Drive',
      'Vetorização de documentos para recuperação precisa',
      'Contexto institucional embutido nas respostas',
    ],
  },
  {
    icon: Beaker,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    title: 'Personalização (Laboratório)',
    items: [
      'Suporte a múltiplos LLMs com roteamento automático',
      'Skills personalizadas para comportamentos específicos',
      'Configuração por usuário: temperatura, tokens, modelo',
      'Dashboard de consumo e custo estimado por sessão',
    ],
  },
  {
    icon: Plug,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    title: 'Integrações Externas',
    items: [
      'Conectores customizados para APIs REST externas',
      'Google Drive para sincronização de documentos',
      'Integração com Groq, OpenAI, Anthropic, Google, Mistral',
      'Webhooks e automações para fluxos clínicos',
    ],
  },
];

const benefits = [
  { icon: Zap, label: 'Respostas em segundos', desc: 'Acesso instantâneo a protocolos e pesquisas' },
  { icon: ShieldCheck, label: 'Baseado em evidências', desc: 'Diretrizes clínicas atualizadas e confiáveis' },
  { icon: Search, label: 'Pesquisa automatizada', desc: 'Varredura de literatura científica em tempo real' },
  { icon: BarChart2, label: 'Monitoramento de uso', desc: 'Log completo de tokens e custos por modelo' },
  { icon: Users, label: 'Multi-usuário', desc: 'Sessões isoladas por perfil e configurações próprias' },
  { icon: RefreshCw, label: 'Roteamento inteligente', desc: 'Modelo ideal selecionado automaticamente por contexto' },
  { icon: Lock, label: 'Segurança', desc: 'Auth robusta com controle de roles admin/user' },
  { icon: Layers, label: 'Arquitetura extensível', desc: 'Skills, integrações e modelos plugáveis sem reescrita' },
];

const stats = [
  { label: 'Provedores LLM', value: '6+', icon: BrainCircuit },
  { label: 'Fontes científicas', value: 'PubMed + Drive', icon: Database },
  { label: 'Modos de resposta', value: 'Chat + Canvas', icon: Layers },
  { label: 'Skills customizáveis', value: 'Ilimitadas', icon: FlaskConical },
];

export default function ChamsaOverview() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Lock className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-bold text-foreground">Acesso Restrito</h2>
        <p className="text-muted-foreground text-sm">Esta página é exclusiva para administradores.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white px-6 py-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-4">
            <BrainCircuit className="w-9 h-9 text-white" />
          </div>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold mb-4">
            <Star className="w-3 h-3 text-yellow-300" /> Visão Geral — Admin Only
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Chamsa Isa</h1>
          <p className="text-lg sm:text-xl text-indigo-100 max-w-2xl mx-auto leading-relaxed">
            Assistente Médico Inteligente que une <strong>IA de ponta</strong>, <strong>gestão do conhecimento</strong> e <strong>pesquisa científica</strong> para transformar a prática clínica.
          </p>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="max-w-5xl mx-auto px-6 -mt-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl p-4 text-center shadow-sm"
            >
              <s.icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <div className="text-lg font-black text-foreground">{s.value}</div>
              <div className="text-[11px] text-muted-foreground font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-foreground mb-2">Funcionalidades</h2>
        <p className="text-muted-foreground text-sm mb-8">Os quatro pilares que compõem a plataforma Chamsa.</p>
        <div className="grid sm:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-3`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="font-bold text-foreground mb-3">{f.title}</h3>
              <ul className="space-y-2">
                {f.items.map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-muted/40 border-y border-border py-12">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Benefícios & Vantagens</h2>
          <p className="text-muted-foreground text-sm mb-8">Por que o Chamsa é indispensável na prática médica moderna.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((b, i) => (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * i }}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
              >
                <b.icon className="w-5 h-5 text-primary mb-2" />
                <div className="font-semibold text-sm text-foreground">{b.label}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{b.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="max-w-5xl mx-auto px-6 py-8 text-center">
        <p className="text-xs text-muted-foreground">
          Documento interno — visível apenas para administradores · Chamsa Isa © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}