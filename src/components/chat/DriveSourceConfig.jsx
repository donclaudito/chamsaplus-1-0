import React, { useState } from 'react';
import { FolderOpen, X, Check, HardDrive } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DEFAULT_DRIVE_FOLDER_ID } from '@/lib/appConfig';

export default function DriveSourceConfig({ folderId, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(folderId || DEFAULT_DRIVE_FOLDER_ID);

  const handleSave = () => {
    onSave(value.trim());
    setEditing(false);
  };

  if (!editing && !folderId) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
        title="Conectar pasta do Google Drive"
      >
        <HardDrive className="w-3.5 h-3.5" />
        Drive
      </button>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="ID da pasta do Drive..."
          className="h-7 text-xs w-52"
          autoFocus
        />
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave}>
          <Check className="w-3.5 h-3.5 text-emerald-500" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(false); setValue(folderId || ''); }}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:opacity-80 transition-all"
      title="Pasta Drive ativa — clique para editar"
    >
      <FolderOpen className="w-3.5 h-3.5" />
      Drive ativo
    </button>
  );
}