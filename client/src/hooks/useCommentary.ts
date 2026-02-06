import { useState, useCallback } from 'react';
import type { CommentaryMessage } from '../types/Commentary';

const MAX_MESSAGES = 3;

export function useCommentary() {
  const [messages, setMessages] = useState<CommentaryMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');

  const addMessage = useCallback((message: CommentaryMessage) => {
    setMessages((prev) => {
      const newMessages = [message, ...prev];
      return newMessages.slice(0, MAX_MESSAGES);
    });
    setCurrentMessage(message.text);
  }, []);

  const updateCurrent = useCallback((text: string) => {
    setCurrentMessage(text);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentMessage('');
  }, []);

  return {
    messages,
    currentMessage,
    addMessage,
    updateCurrent,
    clearMessages,
  };
}
