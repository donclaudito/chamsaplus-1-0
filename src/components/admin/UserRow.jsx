import React from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UserRow({ user, onApprove, onRevoke, isPending, isApproved }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${isApproved ? 'border-border bg-card' : 'border-amber-200 bg-amber-50'}`}>
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
        {(user.full_name || user.email || '?')[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{user.full_name || '—'}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {isApproved ? (
          <>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Aprovado
            </span>
            <Button
              size="sm" variant="outline" onClick={onRevoke}
              disabled={isPending} className="h-7 text-xs"
              aria-label={`Revogar acesso de ${user.full_name || user.email}`}
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Revogar'}
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm" onClick={onApprove} disabled={isPending}
              className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
              aria-label={`Aprovar ${user.full_name || user.email}`}
            >
              {isPending
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <><CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Aprovar</>
              }
            </Button>
            <Button
              size="sm" variant="outline" onClick={onRevoke} disabled={isPending}
              className="h-7 text-xs text-destructive hover:text-destructive"
              aria-label={`Rejeitar ${user.full_name || user.email}`}
            >
              <XCircle className="w-3 h-3" aria-hidden="true" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}