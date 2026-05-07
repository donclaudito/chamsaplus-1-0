import React from 'react';
import { Beaker, Brain, Shield, Zap, History, Activity, CheckCircle2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const skills = [
  { label: 'Deep Reasoning', desc: 'Protocolo CoT (Chain-of-Thought)', icon: Brain, color: 'text-purple-600', bg: 'bg-purple-500/10' },
  { label: 'Grounding Estrito', desc: 'Zero Hallucination Protocol', icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  { label: 'Rastreabilidade', desc: 'Citações obrigatórias de fontes', icon: History, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'ReAct Clínico', desc: 'Ciclo Hipótese & Contraditório', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-500/10' },
];

const metrics = [
  { label: 'Acurácia', value: '99.8%', sub: 'Sincronizada', icon: Activity },
  { label: 'RLHF', value: 'Ativo', sub: 'Aprendendo', icon: Sparkles },
  { label: 'Segurança', value: 'ON', sub: 'Modo Estrito', icon: Shield },
];

const tests = [
  { name: 'Stress Test: Protocolos', status: 'ready', desc: 'Validação de aderência aos protocolos clínicos.' },
  { name: 'Detecção de Hallucinação', status: 'active', desc: 'Monitoramento de integridade de dados.' },
  { name: 'Latência Neural', status: 'ready', desc: 'Otimização da velocidade de resposta.' },
];

export default function Laboratorio() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Beaker className="w-6 h-6 text-purple-500" />
            Laboratório IA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoramento neural e métricas de performance da Chamsa Isa
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{m.label}</span>
                    <m.icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-3xl font-bold">{m.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{m.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Skills */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Skills de Elite Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {skills.map((skill, i) => (
                <motion.div
                  key={skill.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-start gap-3 p-4 rounded-xl ${skill.bg}`}
                >
                  <skill.icon className={`w-5 h-5 ${skill.color} shrink-0 mt-0.5`} />
                  <div>
                    <h4 className={`text-sm font-semibold ${skill.color}`}>{skill.label}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{skill.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ferramentas de Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tests.map(test => (
                <div key={test.name} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div>
                    <h4 className="text-sm font-semibold">{test.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{test.desc}</p>
                  </div>
                  <Badge variant={test.status === 'active' ? 'default' : 'secondary'}>
                    {test.status === 'active' ? (
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ativo</span>
                    ) : 'Pronto'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}