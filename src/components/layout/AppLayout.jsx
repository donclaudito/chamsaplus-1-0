import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, UserCircle, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import AppSidebar from './AppSidebar';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: chatSessions = [] } = useQuery({
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
    mutationFn: () => base44.functions.invoke('createChatSession', {
      title: `Consulta ${chatSessions.length + 1}`,
      messages: [{ role: 'assistant', content: 'Sessão iniciada, Doutor. Pronto para análise estratégica.', timestamp: new Date().toISOString() }],
    }).then(res => res.data),
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

  const sidebarProps = {
    isOpen: sidebarOpen,
    onClose: () => setSidebarOpen(false),
    chats: chatSessions,
    activeChatId,
    onSelectChat: (id) => { setActiveChatId(id); setSidebarOpen(false); },
    onNewChat: () => createChatMutation.mutate(),
    isCreating: createChatMutation.isPending,
    onDeleteChat: (id) => deleteChatMutation.mutate(id),
    onBulkDelete: (ids) => bulkDeleteMutation.mutate(ids),
    onRenameChat: (id, title) => renameChatMutation.mutate({ id, title }),
    onPinChat: (id, pinned) => pinChatMutation.mutate({ id, pinned }),
  };

  const mainContent = (
    <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
          <span className="text-xs font-semibold text-muted-foreground tracking-wide hidden sm:block">Chamsa ISA</span>
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
          <button
            onClick={() => base44.auth.logout('/')}
            className="p-2 hover:bg-red-50 hover:text-red-500 text-muted-foreground rounded-lg transition-colors"
            title="Sair"
            aria-label="Sair da conta"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <Outlet context={{ activeChat, activeChatId, setActiveChatId, chatSessions, createChat: () => createChatMutation.mutate() }} />
      </div>
    </main>
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* Mobile: sidebar overlay (sem painéis redimensionáveis) */}
      <div className="lg:hidden">
        <AppSidebar {...sidebarProps} />
      </div>

      {/* Desktop: painéis redimensionáveis */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" autoSaveId="app-layout">
          <Panel defaultSize={20} minSize={14} maxSize={35} className="flex flex-col">
            <AppSidebar {...sidebarProps} />
          </Panel>
          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/40 transition-colors cursor-col-resize" />
          <Panel minSize={50} className="flex flex-col overflow-hidden">
            {mainContent}
          </Panel>
        </PanelGroup>
      </div>

      {/* Mobile: main content sem painel */}
      <div className="lg:hidden flex-1 flex flex-col overflow-hidden">
        {mainContent}
      </div>
    </div>
  );
}