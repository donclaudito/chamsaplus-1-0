import React, { useState } from 'react';
import { MODELS } from '@/lib/modelRouter';
import { Cpu, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AddPlatformModal from './AddPlatformModal';

export default function ModelSelector({ selectedModel, onChange, autoMode }) {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: customPlatforms = [] } = useQuery({
    queryKey: ['customPlatforms'],
    queryFn: () => base44.entities.CustomPlatform.filter({ is_active: true }, '-created_date', 50),
    initialData: [],
  });

  // Flatten custom platforms into selectable models
  const customModels = customPlatforms.flatMap(p =>
    (p.plans || []).map(plan => ({
      id: plan.model_id,
      label: `${p.name} · ${plan.label}`,
      description: plan.description || '',
      credits: plan.credits || '',
      bg: p.bg || 'bg-gray-500/10',
      border: p.border || 'border-gray-500/30',
      color: p.color || 'text-gray-400',
      provider: 'custom',
      tier: 'custom',
    }))
  );

  const allModels = [...MODELS, ...customModels];
  const current = allModels.find(m => m.id === selectedModel) || MODELS[0];

  return (
    <>
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
        <PopoverContent className="w-72 p-2" align="end">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-2">
            Selecionar Modelo
          </p>

          {/* Built-in models */}
          <div className="space-y-1 mb-2">
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

          {/* Custom platforms */}
          {customModels.length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1 mt-2 border-t border-border pt-2">
                Plataformas Customizadas
              </p>
              <div className="space-y-1 mb-2">
                {customModels.map(model => (
                  <button
                    key={model.id}
                    onClick={() => onChange(model.id)}
                    className={`
                      w-full text-left px-3 py-2.5 rounded-lg transition-all
                      ${selectedModel === model.id ? `${model.bg} ${model.border} border` : 'hover:bg-muted'}
                    `}
                  >
                    <div className={`text-xs font-semibold ${model.color}`}>{model.label}</div>
                    {model.description && <div className="text-[11px] text-muted-foreground mt-0.5">{model.description}</div>}
                    {model.credits && <div className="text-[10px] text-muted-foreground/50 mt-0.5">{model.credits}</div>}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Add platform button */}
          <div className="border-t border-border mt-1 pt-2 px-1 space-y-2">
            <button
              onClick={() => setModalOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors border border-dashed border-primary/30"
            >
              <Plus className="w-3.5 h-3.5" />
              Inserir Nova Plataforma
            </button>
            <p className="text-[10px] text-muted-foreground px-1">
              💡 Modo Auto detecta a complexidade e escolhe o modelo ideal.
            </p>
          </div>
        </PopoverContent>
      </Popover>

      <AddPlatformModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={() => queryClient.invalidateQueries({ queryKey: ['customPlatforms'] })}
      />
    </>
  );
}