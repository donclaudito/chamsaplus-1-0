import React, { useMemo } from 'react';
import { MODELS } from '@/lib/modelRouter';

const COST_PER_1K = {
  'claude_sonnet_4_6': { input: 0.003, output: 0.015 },
  'llama-3.3-70b-versatile': { input: 0.0001, output: 0.0001 },
  'gpt_5_mini': { input: 0.00015, output: 0.0006 },
};

function estimateCost(modelId, inputTokens, outputTokens) {
  const rates = COST_PER_1K[modelId] || { input: 0.001, output: 0.002 };
  return (inputTokens / 1000) * rates.input + (outputTokens / 1000) * rates.output;
}

export default function LLMUsageBar({ usageLog }) {
  const { totalCost, totalTokens, byModel } = useMemo(() => {
    let cost = 0, tokens = 0;
    const models = {};
    for (const entry of usageLog) {
      cost += estimateCost(entry.modelId, entry.inputTokens, entry.outputTokens);
      tokens += entry.inputTokens + entry.outputTokens;
      if (!models[entry.modelId]) models[entry.modelId] = { inputTokens: 0, outputTokens: 0, count: 0 };
      models[entry.modelId].inputTokens += entry.inputTokens;
      models[entry.modelId].outputTokens += entry.outputTokens;
      models[entry.modelId].count += 1;
    }
    return { totalCost: cost, totalTokens: tokens, byModel: models };
  }, [usageLog]);

  if (!usageLog || usageLog.length === 0) return null;

  const barColor = totalCost < 0.01 ? 'bg-emerald-500' : totalCost < 0.05 ? 'bg-amber-500' : 'bg-red-500';
  const barWidth = Math.min(100, (totalCost / 0.1) * 100);

  return (
    <div className="px-4 py-2 border-b border-border bg-card/30 text-[11px] text-muted-foreground flex items-center gap-4">
      <span className="font-mono shrink-0">💰 ~${totalCost.toFixed(4)}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${barWidth}%` }} />
      </div>
      <span className="font-mono shrink-0">{totalTokens.toLocaleString()} tokens</span>
      <div className="flex items-center gap-2 shrink-0">
        {Object.entries(byModel).map(([modelId, usage]) => {
          const meta = MODELS.find(m => m.id === modelId);
          if (!meta) return null;
          return (
            <span key={modelId} className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${meta.bg} ${meta.color}`}>
              {meta.label} ×{usage.count}
            </span>
          );
        })}
      </div>
    </div>
  );
}