import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useChatMessages(activeChatId) {
  const [messages, setMessages] = useState([]);
  const queryClient = useQueryClient();

  const updateChatMutation = useMutation({
    mutationFn: (newMessages) =>
      base44.entities.ChatSession.update(activeChatId, { messages: newMessages }),
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