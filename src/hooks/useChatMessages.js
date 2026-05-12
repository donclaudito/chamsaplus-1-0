import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Backup no Drive separado do mutationFn — mantém o fluxo principal limpo
const mirrorToDrive = ({ activeChatId, sessionTitle, folderId, driveFileIdRef, newMessages }) => {
  if (!folderId || !activeChatId) return;
  base44.functions.invoke('saveChatToDrive', {
    sessionId: activeChatId,
    sessionTitle: sessionTitle || 'Chat sem título',
    messages: newMessages,
    folderId,
    driveFileId: driveFileIdRef.current || null,
  }).then(res => {
    if (res?.data?.driveFileId) driveFileIdRef.current = res.data.driveFileId;
    else if (res?.data?.error) console.warn('[Drive backup] Erro ao salvar:', res.data.error);
  }).catch((err) => console.warn('[Drive backup] Falha na chamada:', err?.message || err));
};

export function useChatMessages(activeChatId, { folderId, sessionTitle } = {}) {
  const [messages, setMessages] = useState([]);
  const queryClient = useQueryClient();

  // Stores the Drive file ID for the current session to enable updates instead of new creates
  const driveFileIdRef = useRef(null);

  const updateChatMutation = useMutation({
    mutationFn: (newMessages) =>
      base44.entities.ChatSession.update(activeChatId, { messages: newMessages }),
    onSuccess: (_, newMessages) => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      // Mirror to Drive after DB persist succeeds (fire-and-forget)
      mirrorToDrive({ activeChatId, sessionTitle, folderId, driveFileIdRef, newMessages });
    },
  });

  const isSaving = updateChatMutation.isPending;
  const saveError = updateChatMutation.isError;

  const addMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  const setMessagesAndPersist = (newMessages) => {
    setMessages(newMessages);
    updateChatMutation.mutate(newMessages);
  };

  const resetMessages = (initial = []) => {
    setMessages(initial);
    driveFileIdRef.current = null; // reset Drive file ref on session switch
  };

  return {
    messages,
    setMessages,
    addMessage,
    setMessagesAndPersist,
    resetMessages,
    isSaving,
    saveError,
  };
}