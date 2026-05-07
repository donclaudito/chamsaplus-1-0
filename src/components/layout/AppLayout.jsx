import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Settings } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppSidebar from './AppSidebar';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: chatSessions = [], isLoading: chatsLoading } = useQuery({
    queryKey: ['chatSessions'],
    queryFn: () => base44.entities.ChatSession.list('-created_date', 50),
    initialData: [],
  });

  const [activeChatId, setActiveChatId] = useState(null);

  useEffect(() => {
    if (chatSessions.length > 0 && !activeChatId) {
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

  const createChatMutation = useMutation({
    mutationFn: () => base44.entities.ChatSession.create({
      title: `Consulta ${chatSessions.length + 1}`,
      messages: [{ role: 'assistant', content: 'Sessão iniciada, Doutor. Pronto para análise estratégica.', timestamp: new Date().toISOString() }]
    }),
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      setActiveChatId(newChat.id);
    },
  });

  const activeChat = chatSessions.find(c => c.id === activeChatId) || chatSessions[0];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        chats={chatSessions}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={() => createChatMutation.mutate()}
        onDeleteChat={(id) => deleteChatMutation.mutate(id)}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center px-3 sm:px-4 gap-2 sm:gap-3 shrink-0 bg-card/80 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs font-semibold text-muted-foreground tracking-wide hidden sm:block">STRATEGIST</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md hidden sm:block">
              Deep Reasoning ON
            </span>
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