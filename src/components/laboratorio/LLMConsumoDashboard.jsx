import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, Cpu, TrendingUp, Calendar } from 'lucide-react';

const COST_PER_1K = {
  'claude_sonnet_4_6': { input: 0.003, output: 0.015, label: 'Claude Sonnet', color: '#8b5cf6' },
  'llama-3.3-70b-versatile': { input: 0.0001, output: 0.0001, label: 'Llama 3.3', color: '#10b981' },
  'gpt_5_mini': { input: 0.00015, output: 0.0006, label: 'GPT Mini', color: '#3b82f6' },
};

function getModelColor(modelId) {
  return COST_PER_1K[modelId]?.color || '#6b7280';
}

export default function LLMConsumoDashboard() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['llmUsageLogs'],
    queryFn: () => base44.entities.LLMUsageLog.list('-created_date', 500),
    refetchInterval: 30000,
  });

  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);

  const stats = useMemo(() => {
    const todayLogs = logs.filter(l => l.date_key === today);
    const monthLogs = logs.filter(l => l.month_key === thisMonth);

    const sumCost = (arr) => arr.reduce((s, l) => s + (l.estimated_cost_usd || 0), 0);
    const sumTokens = (arr) => arr.reduce((s, l) => s + (l.input_tokens || 0) + (l.output_tokens || 0), 0);

    // Daily breakdown (last 7 days)
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      const dayLogs = logs.filter(l => l.date_key === key);
      return {
        date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        custo: parseFloat(sumCost(dayLogs).toFixed(4)),
        tokens: sumTokens(dayLogs),
        calls: dayLogs.length,
      };
    });

    // By model this month
    const byModel = {};
    monthLogs.forEach(l => {
      if (!byModel[l.model_id]) byModel[l.model_id] = { cost: 0, tokens: 0, calls: 0, label: l.model_label || l.model_id };
      byModel[l.model_id].cost += l.estimated_cost_usd || 0;
      byModel[l.model_id].tokens += (l.input_tokens || 0) + (l.output_tokens || 0);
      byModel[l.model_id].calls += 1;
    });

    return {
      todayCost: sumCost(todayLogs),
      todayTokens: sumTokens(todayLogs),
      todayCalls: todayLogs.length,
      monthCost: sumCost(monthLogs),
      monthTokens: sumTokens(monthLogs),
      monthCalls: monthLogs.length,
      last7,
      byModel,
    };
  }, [logs, today, thisMonth]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Hoje · Custo</span>
            </div>
            <p className="text-2xl font-bold font-mono">${stats.todayCost.toFixed(4)}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.todayCalls} chamadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Mês · Custo</span>
            </div>
            <p className="text-2xl font-bold font-mono">${stats.monthCost.toFixed(4)}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.monthCalls} chamadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Hoje · Tokens</span>
            </div>
            <p className="text-2xl font-bold font-mono">{stats.todayTokens.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">in + out</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Mês · Tokens</span>
            </div>
            <p className="text-2xl font-bold font-mono">{stats.monthTokens.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">in + out</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart últimos 7 dias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Custo Diário — Últimos 7 dias (USD)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.last7} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
              <Tooltip
                formatter={(value) => [`$${value}`, 'Custo']}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="custo" radius={[4, 4, 0, 0]}>
                {stats.last7.map((entry, i) => (
                  <Cell key={i} fill={entry.date === new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Por modelo */}
      {Object.keys(stats.byModel).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              Consumo por Modelo — Este mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.byModel).map(([modelId, data]) => {
                const totalMonthCost = stats.monthCost || 0.0001;
                const pct = Math.round((data.cost / totalMonthCost) * 100);
                return (
                  <div key={modelId}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold" style={{ color: getModelColor(modelId) }}>{data.label}</span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{data.calls} calls</span>
                        <span>{data.tokens.toLocaleString()} tk</span>
                        <span className="font-mono font-semibold text-foreground">${data.cost.toFixed(4)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: getModelColor(modelId) }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {logs.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Nenhum dado ainda — inicie uma conversa no Chat para começar a rastrear.
        </div>
      )}
    </div>
  );
}