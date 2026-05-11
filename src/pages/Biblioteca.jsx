import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { FolderSearch, Upload, FileText, Trash2, Search, Plus, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const categoryLabels = {
  protocolo: { label: 'Protocolo', color: 'bg-primary/10 text-primary' },
  laudo: { label: 'Laudo', color: 'bg-emerald-500/10 text-emerald-600' },
  pesquisa: { label: 'Pesquisa', color: 'bg-purple-500/10 text-purple-600' },
  notebook: { label: 'Notebook', color: 'bg-amber-500/10 text-amber-600' },
  outro: { label: 'Outro', color: 'bg-muted text-muted-foreground' },
};

export default function Biblioteca() {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', content: '', category: 'outro' });
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['knowledge', user?.email],
    queryFn: () => base44.entities.Knowledge.filter({ created_by: user.email }, '-created_date', 100),
    enabled: !!user?.email,
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Knowledge.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      setShowAdd(false);
      setNewDoc({ title: '', content: '', category: 'outro' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Knowledge.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge'] }),
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Knowledge.create({
      title: file.name,
      file_url,
      file_type: file.name.split('.').pop(),
      category: 'outro',
    });
    queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    setIsUploading(false);
  };

  const filtered = documents.filter(d =>
    d.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
              <FolderSearch className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
              Biblioteca Clínica
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Base de conhecimento — {documents.length} documentos indexados
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar documentos..."
              className="pl-9"
              style={{ fontSize: '16px' }}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAdd(true)} className="flex-1 sm:flex-none">
              <Plus className="w-4 h-4 mr-2" />
              Nota Manual
            </Button>
            <Button asChild className="relative flex-1 sm:flex-none">
              <label>
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Enviando...' : 'Upload'}
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.md,.txt,.doc,.docx" />
              </label>
            </Button>
          </div>
        </div>

        {/* Documents grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BrainCircuit className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum documento encontrado.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Adicione protocolos e laudos para alimentar a IA.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            <AnimatePresence>
              {filtered.map(doc => {
                const cat = categoryLabels[doc.category] || categoryLabels.outro;
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="p-4 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium text-sm truncate">{doc.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className={`text-[10px] ${cat.color}`}>
                                {cat.label}
                              </Badge>
                              {doc.file_type && (
                                <span className="text-[10px] text-muted-foreground uppercase">{doc.file_type}</span>
                              )}
                            </div>
                            {doc.content && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doc.content}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteMutation.mutate(doc.id)}
                          className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add document modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              value={newDoc.title}
              onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
              placeholder="Título do documento"
            />
            <Select value={newDoc.category} onValueChange={(v) => setNewDoc({ ...newDoc, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="protocolo">Protocolo</SelectItem>
                <SelectItem value="laudo">Laudo</SelectItem>
                <SelectItem value="pesquisa">Pesquisa</SelectItem>
                <SelectItem value="notebook">Notebook</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              value={newDoc.content}
              onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
              placeholder="Conteúdo do documento..."
              className="min-h-[150px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate(newDoc)} disabled={!newDoc.title}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}