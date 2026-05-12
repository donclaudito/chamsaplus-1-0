import React, { useState, useRef } from 'react';
import { Folder, FolderOpen, Plus, Trash2, FolderSearch, ChevronRight, ChevronDown, FolderPlus } from 'lucide-react';
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

function FolderItem({
  folder,
  folders,
  selectedFolderId,
  onSelect,
  onDeleteFolder,
  onCreateSubfolder,
  onMoveFolder,
  docCounts,
  depth = 0,
}) {
  const [expanded, setExpanded] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const color = getColor(folder.color);
  const isSelected = selectedFolderId === folder.id;
  const count = docCounts?.[folder.id] ?? 0;
  const children = folders.filter(f => f.parent_id === folder.id);
  const hasChildren = children.length > 0;

  const handleDragStart = (e) => {
    e.dataTransfer.setData('folderId', folder.id);
    e.stopPropagation();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const draggedId = e.dataTransfer.getData('folderId');
    if (draggedId && draggedId !== folder.id) {
      // Prevent dropping into own descendant
      const isDescendant = (checkId, targetId) => {
        const children = folders.filter(f => f.parent_id === checkId);
        if (children.some(c => c.id === targetId)) return true;
        return children.some(c => isDescendant(c.id, targetId));
      };
      if (!isDescendant(draggedId, folder.id)) {
        onMoveFolder(draggedId, folder.id);
        setExpanded(true);
      }
    }
  };

  return (
    <div>
      <div
        className={cn(
          'group relative flex items-center rounded-lg transition-all',
          dragOver && 'ring-2 ring-primary bg-primary/5'
        )}
        style={{ paddingLeft: depth * 12 }}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Expand toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
          className="p-1 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={expanded ? 'Recolher' : 'Expandir'}
        >
          {hasChildren
            ? (expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)
            : <span className="w-3 h-3 block" />
          }
        </button>

        {/* Folder button */}
        <button
          onClick={() => onSelect(folder.id)}
          className={cn(
            'flex-1 flex items-center gap-2 py-1.5 pr-1 rounded-lg text-sm transition-all text-left min-w-0',
            isSelected
              ? `${color.bg} ${color.text} font-medium`
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <span className="text-base shrink-0">{folder.icon || '📁'}</span>
          <span className="flex-1 truncate">{folder.name}</span>
          <span className="text-[10px] bg-muted rounded-full px-1.5 py-0.5 shrink-0">{count}</span>
        </button>

        {/* Actions (hover) */}
        <div className="absolute right-1 opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onCreateSubfolder(folder.id); }}
            className="p-1 hover:bg-muted rounded transition-all"
            title="Nova subpasta"
            aria-label={`Nova subpasta em ${folder.name}`}
          >
            <FolderPlus className="w-3 h-3 text-muted-foreground hover:text-primary" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
            className="p-1 hover:bg-destructive/10 rounded transition-all"
            title="Excluir pasta"
            aria-label={`Excluir pasta ${folder.name}`}
          >
            <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {children.map(child => (
            <FolderItem
              key={child.id}
              folder={child}
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              onDeleteFolder={onDeleteFolder}
              onCreateSubfolder={onCreateSubfolder}
              onMoveFolder={onMoveFolder}
              docCounts={docCounts}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FolderSidebar({ folders, selectedFolderId, onSelect, onCreateFolder, onDeleteFolder, onMoveFolder, docCounts }) {
  const [showCreate, setShowCreate] = useState(false);
  const [parentIdForCreate, setParentIdForCreate] = useState(null);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📁');
  const [newColor, setNewColor] = useState('blue');

  // Drop on root area (unparent a folder)
  const [rootDragOver, setRootDragOver] = useState(false);

  const openCreate = (parentId = null) => {
    setParentIdForCreate(parentId);
    setNewName('');
    setNewIcon('📁');
    setNewColor('blue');
    setShowCreate(true);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreateFolder({ name: newName.trim(), icon: newIcon, color: newColor, parent_id: parentIdForCreate || null });
    setShowCreate(false);
  };

  // Root folders (no parent)
  const rootFolders = folders.filter(f => !f.parent_id);

  const parentFolder = parentIdForCreate ? folders.find(f => f.id === parentIdForCreate) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pastas</span>
        <button
          onClick={() => openCreate(null)}
          className="p-1 hover:bg-muted rounded-md transition-colors"
          title="Nova pasta raiz"
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
          <span className="text-[10px] bg-muted rounded-full px-1.5 py-0.5">{docCounts?.total ?? 0}</span>
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
          <span className="text-[10px] bg-muted rounded-full px-1.5 py-0.5">{docCounts?.none ?? 0}</span>
        </button>

        {/* Root folders (recursive) */}
        <div
          className={cn('min-h-[4px] rounded transition-all', rootDragOver && 'bg-primary/10 ring-2 ring-primary')}
          onDragOver={(e) => { e.preventDefault(); setRootDragOver(true); }}
          onDragLeave={() => setRootDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setRootDragOver(false);
            const draggedId = e.dataTransfer.getData('folderId');
            if (draggedId) onMoveFolder(draggedId, null);
          }}
        >
          {rootFolders.map(folder => (
            <FolderItem
              key={folder.id}
              folder={folder}
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              onDeleteFolder={onDeleteFolder}
              onCreateSubfolder={(pid) => openCreate(pid)}
              onMoveFolder={onMoveFolder}
              docCounts={docCounts}
              depth={0}
            />
          ))}
        </div>
      </div>

      {/* Create folder modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {parentFolder ? `Nova subpasta em "${parentFolder.name}"` : 'Nova Pasta'}
            </DialogTitle>
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
                autoFocus
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