import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, Users, ShieldCheck, Search, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import UserRow from '@/components/admin/UserRow';

export default function AdminUsers() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, approved, pending, logged

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

  const deleteMutation = useMutation({
    mutationFn: async (userId) => {
      await base44.entities.User.delete(userId);
      return userId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allUsers'] });
      toast({ title: 'Usuário excluído permanentemente' });
    },
    onError: () => toast({ title: 'Erro ao excluir usuário', variant: 'destructive' }),
  });

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name || u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'approved') return u.is_approved;
    if (activeTab === 'pending') return !u.is_approved;
    if (activeTab === 'logged') return !!u.last_login_date;
    return true;
  });

  const pendingCount = users.filter(u => !u.is_approved).length;
  const approvedCount = users.filter(u => u.is_approved).length;
  const loggedCount = users.filter(u => !!u.last_login_date).length;

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
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in-50 duration-300">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Gerenciamento de Usuários</h1>
            <p className="text-xs text-muted-foreground">Administre acessos, permissões e histórico de logins do sistema</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-border/50 text-xs">
          <span className="px-2.5 py-1 font-medium text-muted-foreground">Total: <strong className="text-foreground">{users.length}</strong></span>
        </div>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-2xl border border-border/80 shadow-sm">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-muted/40 border-border/60 text-sm focus-visible:ring-primary/30"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Button
            variant={activeTab === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('all')}
            className={`h-9 rounded-xl px-3.5 text-xs font-medium transition-all ${activeTab === 'all' ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Todos ({users.length})
          </Button>
          <Button
            variant={activeTab === 'approved' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('approved')}
            className={`h-9 rounded-xl px-3.5 text-xs font-medium transition-all gap-1.5 ${activeTab === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Users className="w-3.5 h-3.5" /> Aprovados ({approvedCount})
          </Button>
          <Button
            variant={activeTab === 'pending' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('pending')}
            className={`h-9 rounded-xl px-3.5 text-xs font-medium transition-all gap-1.5 ${activeTab === 'pending' ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Clock className="w-3.5 h-3.5" /> Pendentes ({pendingCount})
          </Button>
          <Button
            variant={activeTab === 'logged' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('logged')}
            className={`h-9 rounded-xl px-3.5 text-xs font-medium transition-all gap-1.5 ${activeTab === 'logged' ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Calendar className="w-3.5 h-3.5" /> Já Logaram ({loggedCount})
          </Button>
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border/60 rounded-2xl p-8 shadow-sm">
            <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground">Nenhum usuário encontrado</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Não encontramos nenhum cadastro correspondente aos filtros ou termos de pesquisa selecionados.
            </p>
          </div>
        ) : (
          filteredUsers.map(u => (
            <UserRow
              key={u.id}
              user={u}
              onApprove={() => approveMutation.mutate({ userId: u.id, approved: true })}
              onRevoke={() => approveMutation.mutate({ userId: u.id, approved: false })}
              onDelete={() => {
                if (confirm(`Tem certeza que deseja excluir permanentemente o usuário ${u.name || u.email}?`)) {
                  deleteMutation.mutate(u.id);
                }
              }}
              isPending={approveMutation.isPending || deleteMutation.isPending}
              isApproved={u.is_approved}
            />
          ))
        )}
      </div>
    </div>
  );
}