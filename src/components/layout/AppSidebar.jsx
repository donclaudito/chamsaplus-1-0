import React, { useState, useRef, useEffect } from 'react';
import ShareDialog from '@/components/chat/ShareDialog';
import { Link, useLocation } from 'react-router-dom';
import {
  MessageSquare, FolderSearch, Beaker, Plus, X, BrainCircuit,
  MoreVertical, Share2, Pin, PinOff, Pencil, Trash2, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '/', icon: MessageSquare, label: 'Chat Isa', color: 'text-indigo-400' },
  { path: '/biblioteca', icon: FolderSearch, label: 'Biblioteca', color: 'text-emerald-400' },
  { path: '/laboratorio', icon: Beaker, label: 'Laboratório', color: 'text-purple-400' },
];

function ChatContextMenu({ chat, onClose, onRename, onPin, onDelete, onShare }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const items = [
    { icon: Share2, label: 'Compartilhar conversa', action: onShare, color: '' },
    { icon: chat.pinned ? PinOff : Pin, label: chat.pinned ? 'Desafixar' : 'Fixar', action: onPin, color: '' },
    { icon: Pencil, label: 'Renomear', action: onRename, color: '' },
    { icon: Trash2, label: 'Excluir', action: onDelete, color: 'text-red-500' },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -4 }}
      transition={{ duration: 0.12 }}
      className="absolute right-0 top-8 z-50 w-52 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
    >
      {items.map(({ icon: Icon, label, action, color }) => (
        <button
          key={label}
          onClick={(e) => { e.stopPropagation(); action(); onClose(); }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium hover:bg-slate-100 transition-colors text-left ${color || 'text-slate-700'}`}
        >
          <Icon className="w-3.5 h-3.5 shrink-0" />
          {label}
        </button>
      ))}
    </motion.div>
  );
}

function ChatItem({ chat, isActive, onSelect, onDelete, onRename, onPin, onClose: closeSidebar }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(chat.title);
  const [shareOpen, setShareOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (renaming && inputRef.current) inputRef.current.focus();
  }, [renaming]);

  const handleRenameConfirm = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== chat.title) onRename(chat.id, trimmed);
    setRenaming(false);
  };

  const handleShare = () => setShareOpen(true);

  return (
    <div className={`group relative flex items-center rounded-lg transition-all ${isActive ? 'bg-primary/10' : 'hover:bg-slate-200'}`}>
      {chat.pinned && (
        <Pin className="w-2.5 h-2.5 text-primary/50 ml-2 shrink-0" />
      )}

      {renaming ? (
        <div className="flex-1 flex items-center gap-1 px-2 py-1.5">
          <input
            ref={inputRef}
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleRenameConfirm(); if (e.key === 'Escape') setRenaming(false); }}
            className="flex-1 bg-white border border-primary/40 rounded-md px-2 py-1 text-xs text-slate-800 outline-none"
          />
          <button onClick={handleRenameConfirm} className="p-1 hover:bg-primary/10 rounded-md">
            <Check className="w-3 h-3 text-primary" />
          </button>
          <button onClick={() => setRenaming(false)} className="p-1 hover:bg-slate-200 rounded-md">
            <X className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => { onSelect(chat.id); closeSidebar(); }}
          className={`flex-1 text-left px-3 py-2.5 text-xs font-medium truncate ${isActive ? 'text-primary' : 'text-slate-700'}`}
        >
          {chat.title}
        </button>
      )}

      {!renaming && (
        <div className="relative shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
            className="opacity-0 group-hover:opacity-100 p-1 mr-1 hover:bg-slate-300 rounded-md transition-all"
            title="Opções"
          >
            <MoreVertical className="w-3.5 h-3.5 text-slate-500" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <ChatContextMenu
                chat={chat}
                onClose={() => setMenuOpen(false)}
                onRename={() => { setRenaming(true); setRenameValue(chat.title); }}
                onPin={() => onPin(chat.id, !chat.pinned)}
                onDelete={() => onDelete(chat.id)}
                onShare={handleShare}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} chat={chat} />
    </div>
  );
}

export default function AppSidebar({ isOpen, onClose, chats, activeChatId, onSelectChat, onNewChat, onDeleteChat, onRenameChat, onPinChat }) {
  const location = useLocation();

  // Pinned first, then rest
  const sorted = [...chats].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <>
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
                  ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}
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
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Sessões</span>
            <button
              onClick={() => { onNewChat(); onClose(); }}
              className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
              title="Nova consulta"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
          <div className="space-y-0.5">
            {sorted.map(chat => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChatId}
                onSelect={onSelectChat}
                onDelete={onDeleteChat}
                onRename={onRenameChat}
                onPin={onPinChat}
                onClose={onClose}
              />
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