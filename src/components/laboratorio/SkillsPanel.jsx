import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Zap, ZapOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import SkillEditorModal from './SkillEditorModal';

const CATEGORY_COLORS = {
  prompt_engineering: 'bg-purple-100 text-purple-700',
  context_injection: 'bg-blue-100 text-blue-700',
  tool_definition: 'bg-amber-100 text-amber-700',
  model_config: 'bg-emerald-100 text-emerald-700',
  other: 'bg-slate-100 text-slate-600',
};

export default function SkillsPanel() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: skills = [] } = useQuery({
    queryKey: ['customSkills'],
    queryFn: () => base44.entities.CustomSkill.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomSkill.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customSkills'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CustomSkill.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customSkills'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomSkill.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customSkills'] }),
  });

  const handleSave = async (form) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: form });
    } else {
      await createMutation.mutateAsync(form);
    }
    setEditing(null);
  };

  const handleToggle = (skill) => {
    updateMutation.mutate({ id: skill.id, data: { is_active: !skill.is_active } });
  };

  const handleEdit = (skill) => {
    setEditing(skill);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const activeCount = skills.filter(s => s.is_active).length;

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <Zap className="w-3 h-3" />
              {activeCount} ativa{activeCount !== 1 ? 's' : ''}
            </span>
          )}
          {activeCount === 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ZapOff className="w-3 h-3" /> Nenhuma skill ativa
            </span>
          )}
        </div>
        <Button size="sm" onClick={handleNew} className="gap-1.5" aria-label="Criar nova skill">
          <Plus className="w-3.5 h-3.5" />
          Nova Skill
        </Button>
      </div>

      {/* Skills list */}
      {skills.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
          <p className="text-2xl mb-2">⚡</p>
          <p className="text-sm font-medium text-foreground">Nenhuma skill cadastrada</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Crie skills para injetar diretivas no sistema da Chamsa Isa
          </p>
          <Button size="sm" variant="outline" onClick={handleNew}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Criar primeira skill
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {skills.map(skill => (
            <div
              key={skill.id}
              className={`group flex items-start gap-3 p-4 rounded-xl border transition-all ${
                skill.is_active
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border bg-muted/30 opacity-60'
              }`}
            >
              <span className="text-xl mt-0.5 shrink-0">{skill.icon || '⚡'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h4 className="text-sm font-semibold text-foreground truncate">{skill.title}</h4>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[skill.category] || CATEGORY_COLORS.other}`}>
                    {skill.category?.replace('_', ' ')}
                  </span>
                </div>
                {skill.description && (
                  <p className="text-xs text-muted-foreground mb-1">{skill.description}</p>
                )}
                <p className="text-[10px] font-mono text-muted-foreground line-clamp-2 bg-muted/50 rounded-md px-2 py-1">
                  {skill.prompt_template}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  ~{Math.round((skill.prompt_template?.length || 0) / 4)} tokens
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={skill.is_active}
                  onCheckedChange={() => handleToggle(skill)}
                  className="scale-90"
                />
                <button
                  onClick={() => handleEdit(skill)}
                  className="p-1.5 rounded-lg hover:bg-muted opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all focus:opacity-100 focus:outline-none"
                  aria-label={`Editar skill ${skill.title}`}
                >
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Deseja deletar a skill "${skill.title}"?`)) {
                      deleteMutation.mutate(skill.id);
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-100 hover:text-red-500 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all focus:opacity-100 focus:outline-none"
                  aria-label={`Deletar skill ${skill.title}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SkillEditorModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        skill={editing}
      />
    </div>
  );
}