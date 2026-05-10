import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, XCircle, Clock, Users, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminUsers() {
  const qc = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
  });

  const approveMutation = useMutation({
    mutationFn: ({ userId, approved }) =>
      base44.functions.invoke('approveUser', { userId, approved }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['allUsers'] }),
  });

  const pending = users.filter(u => !u.is_approved);
  const approved = users.filter(u => u.is_approved);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Gerenciamento de Usuários</h1>
      </div>

      {/* Pending */}
      <section>
        <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Aguardando Aprovação ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl p-4">Nenhum usuário pendente.</p>
        ) : (
          <div className="space-y-2">
            {pending.map(u => (
              <UserRow
                key={u.id}
                user={u}
                onApprove={() => approveMutation.mutate({ userId: u.id, approved: true })}
                onReject={() => approveMutation.mutate({ userId: u.id, approved: false })}
                isPending={approveMutation.isPending}
              />
            ))}
          </div>
        )}
      </section>

      {/* Approved */}
      <section>
        <h2 className="text-sm font-semibold text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Usuários Aprovados ({approved.length})
        </h2>
        <div className="space-y-2">
          {approved.map(u => (
            <UserRow
              key={u.id}
              user={u}
              onRevoke={() => approveMutation.mutate({ userId: u.id, approved: false })}
              isPending={approveMutation.isPending}
              isApproved
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function UserRow({ user, onApprove, onRevoke, isPending, isApproved }) {
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
              <CheckCircle2 className="w-3 h-3" /> Aprovado
            </span>
            <Button size="sm" variant="outline" onClick={onRevoke} disabled={isPending} className="h-7 text-xs">
              Revogar
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" onClick={onApprove} disabled={isPending} className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 className="w-3 h-3" /> Aprovar
            </Button>
            <Button size="sm" variant="outline" onClick={onRevoke} disabled={isPending} className="h-7 text-xs text-destructive hover:text-destructive">
              <XCircle className="w-3 h-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}