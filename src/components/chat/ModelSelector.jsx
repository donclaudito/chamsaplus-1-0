import React from 'react';
import { MODELS } from '@/lib/modelRouter';
import { Cpu } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function ModelSelector({ selectedModel, onChange, autoMode }) {
  const current = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={`
          flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold
          border transition-all hover:opacity-80
          ${current.bg} ${current.border} ${current.color}
        `}>
          <Cpu className="w-3.5 h-3.5" />
          {autoMode ? `Auto · ${current.label}` : current.label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-2">
          Selecionar Modelo
        </p>
        <div className="space-y-1">
          {MODELS.map(model => (
            <button
              key={model.id}
              onClick={() => onChange(model.id)}
              className={`
                w-full text-left px-3 py-2.5 rounded-lg transition-all
                ${selectedModel === model.id ? `${model.bg} ${model.border} border` : 'hover:bg-muted'}
              `}
            >
              <div className={`text-xs font-semibold ${model.color}`}>{model.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{model.description}</div>
              <div className="text-[10px] text-muted-foreground/50 mt-0.5">{model.credits}</div>
            </button>
          ))}
        </div>
        <div className="border-t border-border mt-2 pt-2 px-2">
          <p className="text-[10px] text-muted-foreground">
            💡 Modo Auto detecta a complexidade e escolhe o modelo ideal.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}