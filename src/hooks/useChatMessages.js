import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useChatMessages(activeChatId, { folderId, sessionTitle } = {}) {
  const [messages, setMessages] = useState([]);
  const queryClient = useQueryClient();

  // Stores the Drive file ID for the current session to enable updates instead of new creates
  const driveFileIdRef = useRef(null);

  const updateChatMutation = useMutation({
    mutationFn: async (newMessages) => {
      // 1. Persist to Base44 DB
      await base44.entities.ChatSession.update(activeChatId, { messages: newMessages });

      // 2. Mirror to Google Drive (fire-and-forget — don't block chat)
      if (folderId) {
        base44.functions.invoke('saveChatToDrive', {
          sessionId: activeChatId,
          sessionTitle: sessionTitle || 'Chat sem título',
          messages: newMessages,
          folderId,
          driveFileId: driveFileIdRef.current || null,
        }).then(res => {
          if (res?.data?.driveFileId) {
            driveFileIdRef.current = res.data.driveFileId;
          }
        }).catch(() => {/* silent — Drive backup is best-effort */});
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chatSessions'] }),
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