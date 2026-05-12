import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, Users, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import UserRow from '@/components/admin/UserRow';

export default function AdminUsers() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
  });

  const approveMutation = useMutation({
    mutationFn: ({ userId, approved }) =>
      base44.functions.invoke('approveUser', { userId, approved }),
    onSuccess: (_, { approved }) => {
      qc.invalidateQueries({ queryKey: ['allUsers'] });
      toast({ title: approved ? 'Usuário aprovado' : 'Acesso revogado' });
    },
    onError: () => toast({ title: 'Erro ao atualizar usuário', variant: 'destructive' }),
  });

  const pending  = users.filter(u => !u.is_approved);
  const approved = users.filter(u =>  u.is_approved);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (isError) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-destructive">Erro ao carregar usuários. Tente recarregar a página.</p>
    </div>
  );

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