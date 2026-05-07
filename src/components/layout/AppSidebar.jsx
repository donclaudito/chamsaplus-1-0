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

export default function AppSidebar({ isOpen, onClose, chats, activeChatId, onSelectChat, onNewChat, onDeleteChat }) {
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
        bg-slate-100 text-slate-800
        flex flex-col
        transition-transform duration-300 ease-out
        lg:translate-x-0 lg:static lg:z-auto border-r border-slate-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-wide text-slate-900">CHAMSA ISA</h1>
                <p className="text-[10px] text-slate-500 tracking-widest">v4.1 ESTRATEGISTA</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-1 hover:bg-slate-200 rounded-lg">
              <X className="w-4 h-4 text-slate-600" />
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
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }
                `}
              >
                <item.icon className={`w-4 h-4 ${isActive ? item.color : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Chat Sessions */}
        <div className="flex-1 overflow-y-auto px-3 mt-2">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Sessões
            </span>
            <button
              onClick={() => { onNewChat(); onClose(); }}
              className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
              title="Nova consulta"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
          <div className="space-y-0.5">
            {chats.map(chat => (
              <div
                key={chat.id}
                className={`
                  group flex items-center gap-1 rounded-lg transition-all
                  ${chat.id === activeChatId ? 'bg-primary/10' : 'hover:bg-slate-200'}
                `}
              >
                <button
                  onClick={() => { onSelectChat(chat.id); onClose(); }}
                  className={`
                    flex-1 text-left px-3 py-2.5 text-xs font-medium truncate
                    ${chat.id === activeChatId ? 'text-primary' : 'text-slate-700'}
                  `}
                >
                  {chat.title}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 mr-1 hover:bg-red-100 hover:text-red-500 rounded-md transition-all"
                  title="Excluir consulta"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-slate-500 tracking-wide font-semibold">MOTOR IA ATIVO</span>
          </div>
        </div>
      </aside>
    </>
  );
}