import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, FolderSearch, Beaker, Plus, X, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/', icon: MessageSquare, label: 'Chat Isa', color: 'text-indigo-400' },
  { path: '/biblioteca', icon: FolderSearch, label: 'Biblioteca', color: 'text-emerald-400' },
  { path: '/laboratorio', icon: Beaker, label: 'Laboratório', color: 'text-purple-400' },
];

export default function AppSidebar({ isOpen, onClose, chats, activeChatId, onSelectChat, onNewChat }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed top-0 left-0 h-full z-50 w-72
        bg-sidebar text-sidebar-foreground
        flex flex-col
        transition-transform duration-300 ease-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-wide">CHAMSA ISA</h1>
                <p className="text-[10px] text-sidebar-foreground/50 tracking-widest">v4.1 ESTRATEGISTA</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-1 hover:bg-sidebar-accent rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-sidebar-accent text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }
                `}
              >
                <item.icon className={`w-4 h-4 ${isActive ? item.color : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Chat Sessions */}
        <div className="flex-1 overflow-y-auto px-3 mt-2">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              Sessões
            </span>
            <button
              onClick={() => { onNewChat(); onClose(); }}
              className="p-1 hover:bg-sidebar-accent rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-sidebar-foreground/40" />
            </button>
          </div>
          <div className="space-y-0.5">
            {chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => { onSelectChat(chat.id); onClose(); }}
                className={`
                  w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all truncate
                  ${chat.id === activeChatId
                    ? 'bg-primary/15 text-primary'
                    : 'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }
                `}
              >
                {chat.title}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-sidebar-foreground/40 tracking-wide">MOTOR IA ATIVO</span>
          </div>
        </div>
      </aside>
    </>
  );
}