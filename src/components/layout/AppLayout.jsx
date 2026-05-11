import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, UserCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppSidebar from './AppSidebar';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((user) => {
      setCurrentUser(user);
    }).catch(() => {});
  }, []);

  // Limpa seleção ao trocar de usuário
  useEffect(() => {
    if (currentUser) {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      setActiveChatId(null);
    }
  }, [currentUser?.email]);

  const { data: chatSessions = [], isLoading: chatsLoading } = useQuery({
    queryKey: ['chatSessions', currentUser?.email],
    queryFn: () => currentUser
      ? base44.entities.ChatSession.filter({ created_by: currentUser.email }, '-created_date', 50)
      : [],
    enabled: !!currentUser,
    initialData: [],
  });

  const [activeChatId, setActiveChatId] = useState(null);

  // Seleciona o primeiro chat apenas quando ainda não há nenhum ativo
  useEffect(() => {
    if (!activeChatId && chatSessions.length > 0) {
      setActiveChatId(chatSessions[0].id);
    }
  }, [chatSessions, activeChatId]);

  const deleteChatMutation = useMutation({
    mutationFn: (id) => base44.entities.ChatSession.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      if (activeChatId === deletedId) {
        const remaining = chatSessions.filter(c => c.id !== deletedId);
        setActiveChatId(remaining[0]?.id || null);
      }
    },
  });

  const renameChatMutation = useMutation({
    mutationFn: ({ id, title }) => base44.entities.ChatSession.update(id, { title }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chatSessions'] }),
  });

  const pinChatMutation = useMutation({
    mutationFn: ({ id, pinned }) => base44.entities.ChatSession.update(id, { pinned }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chatSessions'] }),
  });

  const createChatMutation = useMutation({
    mutationFn: () => {
      if (!currentUser) throw new Error('Usuário não autenticado');
      return base44.entities.ChatSession.create({
        title: `Consulta ${chatSessions.length + 1}`,
        messages: [{ role: 'assistant', content: 'Sessão iniciada, Doutor. Pronto para análise estratégica.', timestamp: new Date().toISOString() }]
      });
    },
    onSuccess: (newChat) => {
      queryClient.setQueryData(['chatSessions', currentUser?.email], (old = []) => [newChat, ...old]);
      setActiveChatId(newChat.id);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => Promise.all(ids.map(id => base44.entities.ChatSession.delete(id))),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      if (ids.includes(activeChatId)) {
        const remaining = chatSessions.filter(c => !ids.includes(c.id));
        setActiveChatId(remaining[0]?.id || null);
      }
    },
  });

  const activeChat = chatSessions.find(c => c.id === activeChatId) || chatSessions[0];

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <AppSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        chats={chatSessions}
        activeChatId={activeChatId}
        onSelectChat={(id) => { setActiveChatId(id); setSidebarOpen(false); }}
        onNewChat={() => currentUser && createChatMutation.mutate()}
        isCreating={createChatMutation.isPending || !currentUser}
        onDeleteChat={(id) => deleteChatMutation.mutate(id)}
        onBulkDelete={(ids) => bulkDeleteMutation.mutate(ids)}
        onRenameChat={(id, title) => renameChatMutation.mutate({ id, title })}
        onPinChat={(id, pinned) => pinChatMutation.mutate({ id, pinned })}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center px-3 sm:px-4 gap-2 sm:gap-3 shrink-0 bg-card/80 backdrop-blur-sm safe-area-inset-top">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-muted rounded-lg transition-colors lg:hidden touch-manipulation"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs font-semibold text-muted-foreground tracking-wide hidden sm:block">STRATEGIST</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md hidden md:block">
              Deep Reasoning ON
            </span>
            {currentUser && (
              <div className="flex items-center gap-1.5 bg-muted/60 border border-border px-2.5 py-1 rounded-full">
                <UserCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-[11px] font-medium text-foreground truncate max-w-[120px] sm:max-w-[200px]">
                  {currentUser.email}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-hidden">
          <Outlet context={{ activeChat, activeChatId, setActiveChatId, chatSessions, createChat: () => createChatMutation.mutate() }} />
        </div>
      </main>
    </div>
  );
}