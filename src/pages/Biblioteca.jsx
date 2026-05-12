import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { FolderSearch, Upload, FileText, Trash2, Search, Plus, BrainCircuit, FolderInput, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FolderSidebar from '@/components/biblioteca/FolderSidebar';
import MoveToFolderMenu from '@/components/biblioteca/MoveToFolderMenu';

const categoryLabels = {
  protocolo: { label: 'Protocolo', color: 'bg-primary/10 text-primary' },
  laudo:     { label: 'Laudo',     color: 'bg-emerald-500/10 text-emerald-600' },
  pesquisa:  { label: 'Pesquisa',  color: 'bg-purple-500/10 text-purple-600' },
  notebook:  { label: 'Notebook',  color: 'bg-amber-500/10 text-amber-600' },
  outro:     { label: 'Outro',     color: 'bg-muted text-muted-foreground' },
};

export default function Biblioteca() {
  const [search, setSearch]             = useState('');
  const [showAdd, setShowAdd]           = useState(false);
  const [newDoc, setNewDoc]             = useState({ title: '', content: '', category: 'outro', folder_id: null });
  const [isUploading, setIsUploading]   = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // doc id pending delete
  const [confirmFolderId, setConfirmFolderId] = useState(null); // folder id pending delete
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['knowledge', user?.email],
    queryFn: () => base44.entities.Knowledge.filter({ created_by: user.email }, '-created_date', 200),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['knowledgeFolders', user?.email],
    queryFn: () => base44.entities.KnowledgeFolder.filter({ created_by: user.email }, 'name', 100),
    enabled: !!user?.email,
    initialData: [],
  });

  const createDocMutation = useMutation({
    mutationFn: (data) => base44.entities.Knowledge.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      setShowAdd(false);
      setNewDoc({ title: '', content: '', category: 'outro', folder_id: null });
    },
    onError: () => toast({ title: 'Erro ao criar documento', variant: 'destructive' }),
  });

  const deleteDocMutation = useMutation({
    mutationFn: (id) => base44.entities.Knowledge.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      toast({ title: 'Documento removido' });
    },
    onError: () => toast({ title: 'Erro ao remover documento', variant: 'destructive' }),
  });

  const updateDocMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Knowledge.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge'] }),
    onError: () => toast({ title: 'Erro ao mover documento', variant: 'destructive' }),
  });

  const createFolderMutation = useMutation({
    mutationFn: (data) => base44.entities.KnowledgeFolder.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledgeFolders'] }),
    onError: () => toast({ title: 'Erro ao criar pasta', variant: 'destructive' }),
  });

  const moveFolderMutation = useMutation({
    mutationFn: ({ id, parentId }) => base44.entities.KnowledgeFolder.update(id, { parent_id: parentId || null }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledgeFolders'] }),
    onError: () => toast({ title: 'Erro ao mover pasta', variant: 'destructive' }),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId) => {
      const docsInFolder = documents.filter(d => d.folder_id === folderId);
      await Promise.all(docsInFolder.map(d => base44.entities.Knowledge.update(d.id, { folder_id: null })));
      return base44.entities.KnowledgeFolder.delete(folderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeFolders'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      setSelectedFolder(null);
      toast({ title: 'Pasta removida' });
    },
    onError: () => toast({ title: 'Erro ao remover pasta', variant: 'destructive' }),
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Knowledge.create({
        title: file.name,
        file_url,
        file_type: file.name.split('.').pop(),
        category: 'outro',
        folder_id: selectedFolder && selectedFolder !== '__none__' ? selectedFolder : null,
      });
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    } catch {
      toast({ title: 'Erro ao fazer upload do arquivo', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const docCounts = useMemo(() => {
    const counts = { total: documents.length, none: 0 };
    for (const doc of documents) {
      if (!doc.folder_id) counts.none++;
      else counts[doc.folder_id] = (counts[doc.folder_id] || 0) + 1;
    }
    return counts;
  }, [documents]);

  const filtered = useMemo(() => {
    let docs = documents;
    if (selectedFolder === '__none__') docs = docs.filter(d => !d.folder_id);
    else if (selectedFolder) docs = docs.filter(d => d.folder_id === selectedFolder);
    if (search) docs = docs.filter(d => d.title?.toLowerCase().includes(search.toLowerCase()));
    return docs;
  }, [documents, selectedFolder, search]);

  const selectedFolderObj = folders.find(f => f.id === selectedFolder);

  return (
    <div className="h-full flex overflow-hidden">
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 border-r border-border bg-card/50 overflow-hidden"
          >
            <div className="w-[220px] h-full p-3">
              <FolderSidebar
                folders={folders}
                selectedFolderId={selectedFolder}
                onSelect={setSelectedFolder}
                onCreateFolder={(data) => createFolderMutation.mutate(data)}
                onDeleteFolder={(id) => setConfirmFolderId(id)}
                onMoveFolder={(id, parentId) => moveFolderMutation.mutate({ id, parentId })}
                docCounts={docCounts}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-w-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(o => !o)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              >
                {sidebarOpen
                  ? <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
                  : <PanelLeftOpen  className="w-4 h-4 text-muted-foreground" />
                }
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  {selectedFolderObj ? (
                    <><span>{selectedFolderObj.icon}</span>{selectedFolderObj.name}</>
                  ) : (
                    <><FolderSearch className="w-5 h-5 text-emerald-500" />Biblioteca Clínica</>
                  )}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filtered.length} documento{filtered.length !== 1 ? 's' : ''}
                  {selectedFolder && selectedFolder !== '__none__' ? ' nesta pasta' : ' indexados'}
                </p>
              </div>
            </div>
          </div>

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

          {docsLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <BrainCircuit className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum documento encontrado.</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                {selectedFolder === '__none__' ? 'Mova documentos para cá ou faça upload.' : 'Adicione protocolos e laudos para alimentar a IA.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              <AnimatePresence>
                {filtered.map(doc => {
                  const cat = categoryLabels[doc.category] || categoryLabels.outro;
                  const docFolder = folders.find(f => f.id === doc.folder_id);
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
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="secondary" className={`text-[10px] ${cat.color}`}>
                                  {cat.label}
                                </Badge>
                                {docFolder && (
                                  <Badge variant="outline" className="text-[10px] gap-1">
                                    <span>{docFolder.icon}</span>{docFolder.name}
                                  </Badge>
                                )}
                                {doc.file_type && (
                                  <span className="text-[10px] text-muted-foreground uppercase">{doc.file_type}</span>
                                )}
                              </div>
                              {doc.content && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doc.content}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <MoveToFolderMenu
                              folders={folders}
                              onMove={(folderId) => updateDocMutation.mutate({ id: doc.id, data: { folder_id: folderId } })}
                            >
                              <button className="p-1.5 hover:bg-muted rounded-lg transition-colors" aria-label={`Mover ${doc.title} para pasta`}>
                                <FolderInput className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                              </button>
                            </MoveToFolderMenu>
                            <button
                              onClick={() => setConfirmDeleteId(doc.id)}
                              className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors"
                              aria-label={`Remover ${doc.title}`}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Confirm delete doc */}
      <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remover documento?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { deleteDocMutation.mutate(confirmDeleteId); setConfirmDeleteId(null); }}>
              Remover
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm delete folder */}
      <Dialog open={!!confirmFolderId} onOpenChange={() => setConfirmFolderId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remover pasta?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Os documentos dentro da pasta serão movidos para "Sem pasta".</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmFolderId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { deleteFolderMutation.mutate(confirmFolderId); setConfirmFolderId(null); }}>
              Remover
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
            <div className="flex gap-2">
              <Select value={newDoc.category} onValueChange={(v) => setNewDoc({ ...newDoc, category: v })}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="protocolo">Protocolo</SelectItem>
                  <SelectItem value="laudo">Laudo</SelectItem>
                  <SelectItem value="pesquisa">Pesquisa</SelectItem>
                  <SelectItem value="notebook">Notebook</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={newDoc.folder_id || '__none__'}
                onValueChange={(v) => setNewDoc({ ...newDoc, folder_id: v === '__none__' ? null : v })}
              >
                <SelectTrigger className="flex-1"><SelectValue placeholder="Pasta..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem pasta</SelectItem>
                  {folders.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.icon} {f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={newDoc.content}
              onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
              placeholder="Conteúdo do documento..."
              className="min-h-[150px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
              <Button onClick={() => createDocMutation.mutate(newDoc)} disabled={!newDoc.title}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}