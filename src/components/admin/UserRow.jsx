import React from 'react';
import { CheckCircle2, XCircle, Loader2, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UserRow({ user, onApprove, onRevoke, onDelete, isPending, isApproved }) {
  const lastLoginFormatted = user.last_login_date 
    ? new Date(user.last_login_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Nunca acessou';

  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${isApproved ? 'border-border bg-card hover:border-primary/30' : 'border-amber-200 bg-amber-50/50'}`}>
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
        {(user.name || user.full_name || user.email || '?')[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{user.name || user.full_name || '—'}</p>
        <p className="text-xs text-muted-foreground truncate mb-1">{user.email}</p>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Calendar className="w-3 h-3 text-primary/70" />
          <span>Último acesso: <strong className="text-foreground/80 font-medium">{lastLoginFormatted}</strong></span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {isApproved ? (
          <>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Aprovado
            </span>
            <Button
              size="sm" variant="outline" onClick={onRevoke}
              disabled={isPending} className="h-8 text-xs px-2.5 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
              aria-label={`Revogar acesso de ${user.name || user.full_name || user.email}`}
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Revogar'}
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm" onClick={onApprove} disabled={isPending}
              className="h-8 text-xs px-3 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              aria-label={`Aprovar ${user.name || user.full_name || user.email}`}
            >
              {isPending
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <><CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Aprovar</>
              }
            </Button>
            <Button
              size="sm" variant="outline" onClick={onRevoke} disabled={isPending}
              className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Rejeitar ${user.name || user.full_name || user.email}`}
            >
              <XCircle className="w-3 h-3" aria-hidden="true" />
            </Button>
          </>
        )}
        {onDelete && (
          <Button
            size="sm" variant="outline" onClick={onDelete} disabled={isPending}
            className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-white border-destructive/30"
            aria-label={`Excluir ${user.name || user.full_name || user.email}`}
            title="Excluir usuário permanentemente"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}