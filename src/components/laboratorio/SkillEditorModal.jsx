import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const CATEGORY_LABELS = {
  prompt_engineering: '🧠 Prompt Engineering',
  context_injection: '💉 Context Injection',
  tool_definition: '🔧 Tool Definition',
  model_config: '⚙️ Model Config',
  other: '📦 Outro',
};

const EMPTY = { title: '', description: '', prompt_template: '', category: 'prompt_engineering', is_active: true, icon: '⚡' };

export default function SkillEditorModal({ open, onClose, onSave, skill }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(skill ? { ...EMPTY, ...skill } : EMPTY);
  }, [skill, open]);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.prompt_template.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {skill ? '✏️ Editar Skill' : '➕ Nova Skill para Chamsa Isa'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-3">
            <div className="w-16">
              <Label className="text-xs mb-1 block">Ícone</Label>
              <Input
                value={form.icon}
                onChange={e => set('icon', e.target.value)}
                className="text-center text-xl h-10"
                maxLength={2}
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs mb-1 block">Título da Skill *</Label>
              <Input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Ex: Diagnóstico Diferencial Avançado"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1 block">Descrição</Label>
            <Input
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Breve descrição do que esta skill faz..."
            />
          </div>

          <div>
            <Label className="text-xs mb-1 block">Categoria</Label>
            <Select value={form.category} onValueChange={val => set('category', val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-1 block">
              Prompt Template / Diretivas *
              <span className="text-muted-foreground ml-2 font-normal">
                (será injetado no system prompt da Chamsa)
              </span>
            </Label>
            <Textarea
              value={form.prompt_template}
              onChange={e => set('prompt_template', e.target.value)}
              placeholder={`Ex:\nQUANDO solicitado um diagnóstico diferencial:\n1. Liste no mínimo 5 hipóteses ordenadas por probabilidade\n2. Para cada hipótese, indique critérios diagnósticos e Red Flags\n3. Sugira exames complementares específicos`}
              className="min-h-[160px] font-mono text-xs"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              {form.prompt_template.length} caracteres · ~{Math.round(form.prompt_template.length / 4)} tokens estimados
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            <Switch
              checked={form.is_active}
              onCheckedChange={val => set('is_active', val)}
              id="skill-active"
            />
            <Label htmlFor="skill-active" className="text-sm cursor-pointer">
              Skill ativa — será injetada automaticamente no chat
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !form.title.trim() || !form.prompt_template.trim()}>
            {saving ? 'Salvando...' : skill ? 'Salvar Alterações' : 'Criar Skill'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}