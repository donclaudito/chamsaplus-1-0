import React, { useState } from 'react';
import { Folder, FolderOpen, Plus, Trash2, FolderSearch, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const FOLDER_COLORS = [
  { id: 'blue',    text: 'text-blue-500',    bg: 'bg-blue-500/10'    },
  { id: 'emerald', text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'purple',  text: 'text-purple-500',  bg: 'bg-purple-500/10'  },
  { id: 'amber',   text: 'text-amber-500',   bg: 'bg-amber-500/10'   },
  { id: 'rose',    text: 'text-rose-500',    bg: 'bg-rose-500/10'    },
  { id: 'cyan',    text: 'text-cyan-500',    bg: 'bg-cyan-500/10'    },
];

function getColor(colorId) {
  return FOLDER_COLORS.find(c => c.id === colorId) || FOLDER_COLORS[0];
}

export default function FolderSidebar({ folders, selectedFolderId, onSelect, onCreateFolder, onDeleteFolder, docCounts }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📁');
  const [newColor, setNewColor] = useState('blue');

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreateFolder({ name: newName.trim(), icon: newIcon, color: newColor });
    setNewName('');
    setNewIcon('📁');
    setNewColor('blue');
    setShowCreate(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pastas</span>
        <button
          onClick={() => setShowCreate(true)}
          className="p-1 hover:bg-muted rounded-md transition-colors"
          title="Nova pasta"
        >
          <Plus className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-0.5 flex-1 overflow-y-auto">
        {/* All documents */}
        <button
          onClick={() => onSelect(null)}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all text-left',
            selectedFolderId === null
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <FolderSearch className="w-4 h-4 shrink-0" />
          <span className="flex-1 truncate">Todos</span>
          <span className="text-[10px] bg-muted rounded-full px-1.5 py-0.5">
            {docCounts?.total ?? 0}
          </span>
        </button>

        {/* Uncategorized */}
        <button
          onClick={() => onSelect('__none__')}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all text-left',
            selectedFolderId === '__none__'
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Folder className="w-4 h-4 shrink-0" />
          <span className="flex-1 truncate">Sem pasta</span>
          <span className="text-[10px] bg-muted rounded-full px-1.5 py-0.5">
            {docCounts?.none ?? 0}
          </span>
        </button>

        {/* User folders */}
        {folders.map(folder => {
          const color = getColor(folder.color);
          const count = docCounts?.[folder.id] ?? 0;
          const isSelected = selectedFolderId === folder.id;
          return (
            <div key={folder.id} className="group relative flex items-center">
              <button
                onClick={() => onSelect(folder.id)}
                className={cn(
                  'flex-1 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all text-left',
                  isSelected
                    ? `${color.bg} ${color.text} font-medium`
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span className="text-base shrink-0">{folder.icon || '📁'}</span>
                <span className="flex-1 truncate">{folder.name}</span>
                <span className="text-[10px] bg-muted rounded-full px-1.5 py-0.5">{count}</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                className="absolute right-1 opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all"
                title="Excluir pasta"
                aria-label={`Excluir pasta ${folder.name}`}
              >
                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Create folder modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex gap-2">
              <Input
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                className="w-14 text-center text-lg"
                maxLength={2}
                placeholder="📁"
              />
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome da pasta"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="flex gap-2">
              {FOLDER_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setNewColor(c.id)}
                  aria-pressed={newColor === c.id}
                  aria-label={`Cor ${c.id}`}
                  className={cn(
                    'w-7 h-7 rounded-full border-2 transition-all',
                    c.bg,
                    newColor === c.id ? 'border-foreground scale-110' : 'border-transparent'
                  )}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={!newName.trim()}>Criar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}