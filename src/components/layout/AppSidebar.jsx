import React, { useState, useRef, useEffect } from 'react';
import ShareDialog from '@/components/chat/ShareDialog';
import { Link, useLocation } from 'react-router-dom';
import {
  MessageSquare, FolderSearch, Beaker, Plus, X, BrainCircuit,
  MoreVertical, Share2, Pin, PinOff, Pencil, Trash2, Check,
  CheckSquare, Square, Plug, Users, LogOut, HelpCircle
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '/', icon: MessageSquare, label: 'Chat Isa', color: 'text-indigo-400' },
  { path: '/biblioteca', icon: FolderSearch, label: 'Biblioteca', color: 'text-emerald-400' },
  { path: '/laboratorio', icon: Beaker, label: 'Laboratório', color: 'text-purple-400' },
  { path: '/integracoes', icon: Plug, label: 'Integrações', color: 'text-amber-400' },
  { path: '/ajuda', icon: HelpCircle, label: 'Ajuda', color: 'text-rose-400' },
];

function ChatContextMenu({ chat, onClose, onRename, onPin, onDelete, onShare, isDeleting = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja excluir "${chat.title}"? Esta ação não pode ser desfeita.`)) {
      onDelete();
    }
  };

  const items = [
    { icon: Share2, label: 'Compartilhar conversa', action: onShare, color: '' },
    { icon: chat.pinned ? PinOff : Pin, label: chat.pinned ? 'Desafixar' : 'Fixar', action: onPin, color: '' },
    { icon: Pencil, label: 'Renomear', action: onRename, color: '' },
    { icon: Trash2, label: 'Excluir', action: handleDelete, color: 'text-red-500', disabled: isDeleting },
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
      {items.map(({ icon: Icon, label, action, color, disabled }) => (
        <button
          key={label}
          onClick={(e) => { e.stopPropagation(); if (!disabled) action(); onClose(); }}
          disabled={disabled}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium hover:bg-slate-100 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed ${color || 'text-slate-700'}`}
          aria-label={label}
        >
          <Icon className="w-3.5 h-3.5 shrink-0" />
          {label}
        </button>
      ))}
    </motion.div>
  );
}

function ChatItem({ chat, isActive, onSelect, onDelete, onRename, onPin, onClose: closeSidebar, isDeletingId = null, isPinningId = null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(chat.title);
  const [shareOpen, setShareOpen] = useState(false);
  const [renameError, setRenameError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (renaming && inputRef.current) inputRef.current.focus();
  }, [renaming]);

  const handleRenameConfirm = async () => {
    const trimmed = renameValue.trim();
    setRenameError('');
    if (!trimmed) {
      setRenameError('O título não pode estar vazio');
      return;
    }
    if (trimmed === chat.title) {
      setRenaming(false);
      return;
    }
    try {
      await onRename(chat.id, trimmed);
      setRenaming(false);
    } catch (e) {
      setRenameError('Erro ao renomear: ' + (e.message || 'Tente novamente'));
    }
  };

  const handleShare = () => setShareOpen(true);
  const isDeleting = isDeletingId === chat.id;
  const isPinning = isPinningId === chat.id;

  return (
    <div className={`group relative flex items-center rounded-lg transition-all ${isActive ? 'bg-primary/10' : 'hover:bg-slate-200'}`}>
      {chat.pinned && (
        <Pin className="w-2.5 h-2.5 text-primary/50 ml-2 shrink-0" />
      )}

      {renaming ? (
        <div className="flex-1 flex flex-col gap-0.5 px-2 py-1.5">
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              value={renameValue}
              onChange={e => { setRenameValue(e.target.value); setRenameError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handleRenameConfirm(); if (e.key === 'Escape') { setRenaming(false); setRenameError(''); } }}
              className="flex-1 bg-white border border-primary/40 rounded-md px-2 py-1 text-xs text-slate-800 outline-none"
              aria-label="Novo título do chat"
              maxLength={100}
            />
            <button onClick={handleRenameConfirm} className="p-1 hover:bg-primary/10 rounded-md" aria-label="Confirmar renomeação">
              <Check className="w-3 h-3 text-primary" />
            </button>
            <button onClick={() => { setRenaming(false); setRenameError(''); }} className="p-1 hover:bg-slate-200 rounded-md" aria-label="Cancelar renomeação">
              <X className="w-3 h-3 text-slate-400" />
            </button>
          </div>
          {renameError && (
            <p className="text-[10px] text-red-500 px-1">{renameError}</p>
          )}
        </div>
      ) : (
        <button
          onClick={() => { onSelect(chat.id); closeSidebar(); }}
          className={`flex-1 text-left px-3 py-3 sm:py-2.5 text-xs font-medium truncate touch-manipulation ${isActive ? 'text-primary' : 'text-slate-700'}`}
        >
          {chat.title}
        </button>
      )}

      {!renaming && (
        <div className="relative shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
            className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 touch:opacity-100 p-2 mr-1 hover:bg-slate-300 rounded-md transition-all active:bg-slate-300 focus:outline-none"
            aria-label={`Opções para ${chat.title}`}
            disabled={isDeleting || isPinning}
          >
            {isDeleting ? (
              <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-red-600 rounded-full animate-spin" />
            ) : (
              <MoreVertical className="w-3.5 h-3.5 text-slate-500" />
            )}
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
                isDeleting={isDeleting}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {isPinning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/20 rounded-lg flex items-center justify-center pointer-events-none"
        >
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </motion.div>
      )}

      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} chat={chat} />
    </div>
  );
}

export default function AppSidebar({ isOpen, onClose, chats, activeChatId, onSelectChat, onNewChat, isCreating, onDeleteChat, onBulkDelete, onRenameChat, onPinChat }) {
  const location = useLocation();
  const { user } = useAuth();
  const [selected, setSelected] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [pinningId, setPinningId] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const sorted = [...chats].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Tem certeza que deseja excluir ${selected.size} conversa(s)? Esta ação não pode ser desfeita.`)) return;
    setBulkDeleting(true);
    try {
      await onBulkDelete([...selected]);
      setSelected(new Set());
      setSelectMode(false);
    } catch (e) {
      console.error('Erro ao deletar em bloco:', e);
      alert('Erro ao excluir conversas: ' + (e.message || 'Tente novamente'));
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDeleteChat = async (id) => {
    setDeletingId(id);
    try {
      await onDeleteChat(id);
    } catch (e) {
      console.error('Erro ao deletar chat:', e);
      alert('Erro ao excluir conversa: ' + (e.message || 'Tente novamente'));
    } finally {
      setDeletingId(null);
    }
  };

  const handlePinChat = async (id, pinned) => {
    setPinningId(id);
    try {
      await onPinChat(id, pinned);
    } catch (e) {
      console.error('Erro ao fixar chat:', e);
    } finally {
      setPinningId(null);
    }
  };

  const toggleSelectMode = () => {
    setSelectMode(v => !v);
    setSelected(new Set());
  };

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
        fixed top-0 left-0 h-full z-50 w-[80vw] max-w-[288px]
        bg-slate-100 text-slate-800
        flex flex-col
        transition-transform duration-300 ease-out
        lg:translate-x-0 lg:static lg:z-auto lg:w-72 border-r border-slate-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://media.base44.com/images/public/69fca602fc26c81e3e0767df/2215309d9_orengostei.png"
              alt="Logo"
              className="w-8 h-8 object-contain"
            />
          </div>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-slate-200 rounded-lg">
            <X className="w-4 h-4 text-slate-600" />
          </button>
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
            <div className="flex items-center gap-1">
              {/* Select mode toggle */}
                  <button
                    onClick={toggleSelectMode}
                    className={`p-1 rounded-lg transition-colors text-[10px] font-semibold focus:outline-none ${selectMode ? 'bg-primary/15 text-primary' : 'hover:bg-slate-200 text-slate-500'}`}
                    aria-label={selectMode ? 'Sair do modo seleção' : 'Entrar no modo seleção'}
                    aria-pressed={selectMode}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                  </button>
              {/* New chat button — disabled while creating */}
               <button
                 onClick={() => { if (!isCreating) { onNewChat(); onClose(); } }}
                 disabled={isCreating}
                 className="p-1 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-40 focus:outline-none"
                 aria-label="Nova consulta"
               >
                 {isCreating ? (
                   <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                 ) : (
                   <Plus className="w-3.5 h-3.5 text-slate-500" />
                 )}
               </button>
            </div>
          </div>

          {/* Bulk delete bar */}
          {selectMode && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center justify-between mb-2 px-1 py-1.5 bg-red-50 border border-red-200 rounded-lg"
            >
              <span className="text-[10px] text-red-600 font-semibold">{selected.size} selecionada(s)</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setSelected(new Set(sorted.map(c => c.id)))}
                  className="text-[10px] text-slate-500 hover:text-slate-700 px-1 focus:outline-none"
                  aria-label="Selecionar todas"
                >
                  Todas
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={selected.size === 0 || bulkDeleting}
                  className="flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white rounded-md text-[10px] font-semibold disabled:opacity-40 hover:bg-red-600 transition-colors focus:outline-none"
                  aria-label={`Excluir ${selected.size} conversa(s)`}
                >
                  {bulkDeleting ? (
                    <>
                      <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3 h-3" /> Excluir
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          <div className="space-y-0.5">
            {sorted.map(chat => (
              <div key={chat.id} className="flex items-center gap-1">
                {selectMode && (
                  <button onClick={() => toggleSelect(chat.id)} className="shrink-0 p-1">
                    {selected.has(chat.id)
                      ? <CheckSquare className="w-3.5 h-3.5 text-primary" />
                      : <Square className="w-3.5 h-3.5 text-slate-400" />
                    }
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <ChatItem
                    chat={chat}
                    isActive={chat.id === activeChatId}
                    onSelect={onSelectChat}
                    onDelete={handleDeleteChat}
                    onRename={onRenameChat}
                    onPin={handlePinChat}
                    onClose={onClose}
                    isDeletingId={deletingId}
                    isPinningId={pinningId}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin links */}
        {user?.role === 'admin' && (
          <div className="px-3 pb-1 space-y-1">
            <Link
              to="/admin/usuarios"
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all
                ${location.pathname === '/admin/usuarios'
                  ? 'bg-amber-500/10 text-amber-600'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'}
              `}
            >
              <Users className="w-4 h-4" />
              Gerenciar Usuários
            </Link>
            <Link
              to="/admin/documentacao"
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all
                ${location.pathname === '/admin/documentacao'
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'}
              `}
            >
              <span className="text-sm">📄</span>
              Documentação Técnica
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-500 tracking-wide font-semibold">MOTOR IA ATIVO</span>
            </div>
            <button
              onClick={() => base44.auth.logout('/')}
              className="p-1.5 hover:bg-red-50 hover:text-red-500 text-slate-400 rounded-lg transition-colors"
              title="Sair"
              aria-label="Sair da conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}