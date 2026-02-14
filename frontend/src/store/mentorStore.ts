/**
 * Mentor Store
 * Manages mentor chat state
 */

import { create } from 'zustand';
import type { ChatMessage } from '@/types';

export interface MentorState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearHistory: () => void;
}

export const useMentorStore = create<MentorState>((set) => ({
  messages: [],
  isLoading: false,
  error: null,

  addMessage: (message: ChatMessage) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  setMessages: (messages: ChatMessage[]) => set({ messages }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),

  clearHistory: () => set({ messages: [] }),
}));
