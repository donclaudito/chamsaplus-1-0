import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Database, RefreshCw, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function VectorIndexPanel() {
  const DEFAULT_FOLDER = localStorage.getItem('chamsa_drive_folder') || '';
  const [folderId, setFolderId] = useState(DEFAULT_FOLDER);
  const [indexing, setIndexing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const { data: vectorCount, refetch: refetchCount } = useQuery({
    queryKey: ['vectorCount'],
    queryFn: () => base44.entities.KnowledgeVector.list('-created_date', 1).then(r => r),
    select: () => base44.entities.KnowledgeVector.filter({}).then(r => r.length),
  });

  // Simpler count via list with large limit
  const { data: allVectors, refetch } = useQuery({
    queryKey: ['allVectors'],
    queryFn: () => base44.entities.KnowledgeVector.list('-created_date', 500),
    initialData: [],
  });

  const uniqueSources = [...new Set(allVectors.map(v => v.source_name))];

  const handleIndex = async () => {
    if (!folderId.trim()) return;
    setIndexing(true);
    setResult(null);
    setError(null);
    try {
      const res = await base44.functions.invoke('vectorizeKnowledge', { folder_id: folderId.trim() });
      setResult(res.data);
      refetch();
    } catch (e) {
      setError(e.message);
    } finally {
      setIndexing(false);
    }
  };

  const totalChunks = allVectors.length;
  const sourceCount = uniqueSources.length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-violet-400">{totalChunks}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Chunks indexados</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{sourceCount}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Documentos únicos</div>
        </div>
      </div>

      {/* Folder input + trigger */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">ID da Pasta do Google Drive</label>
        <div className="flex gap-2">
          <Input
            value={folderId}
            onChange={e => setFolderId(e.target.value)}
            placeholder="Ex: 1eWosMBtk9N5tICS..."
            className="font-mono text-xs"
          />
          <Button onClick={handleIndex} disabled={indexing || !folderId.trim()} className="shrink-0 gap-1.5">
            {indexing ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Indexando...</>
            ) : (
              <><Zap className="w-3.5 h-3.5" /> Indexar</>
            )}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground/60">
          Gera embeddings vetoriais dos documentos — necessário apenas quando os arquivos mudam.
          O RAG usa esses vetores automaticamente no chat.
        </p>
      </div>

      {/* Result feedback */}
      {result && (
        <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-600 dark:text-emerald-400 space-y-0.5">
            <div className="font-semibold">Indexação concluída</div>
            <div>{result.files_processed} arquivos · {result.new_chunks} novos chunks · {result.skipped_chunks} inalterados</div>
          </div>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Indexed sources list */}
      {uniqueSources.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Documentos no índice</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {uniqueSources.map(name => {
              const count = allVectors.filter(v => v.source_name === name).length;
              return (
                <div key={name} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-1.5">
                  <span className="text-xs truncate">{name}</span>
                  <span className="text-[10px] text-muted-foreground ml-2 shrink-0">{count} chunks</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}