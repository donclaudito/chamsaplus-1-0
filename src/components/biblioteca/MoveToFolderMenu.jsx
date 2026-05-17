import React from 'react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

export default function MoveToFolderMenu({ folders, onMove, children }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onMove(null)}>
          <span className="mr-2">📂</span> Sem pasta
        </DropdownMenuItem>
        {folders.length > 0 && <DropdownMenuSeparator />}
        {folders.length === 0 && (
          <DropdownMenuItem disabled className="text-muted-foreground text-xs">
            Nenhuma pasta criada
          </DropdownMenuItem>
        )}
        {folders.map(f => (
          <DropdownMenuItem key={f.id} onClick={() => onMove(f.id)}>
            <span className="mr-2">{f.icon || '📁'}</span>
            <span className="truncate">{f.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}