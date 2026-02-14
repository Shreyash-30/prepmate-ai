/**
 * Roadmap Store
 * Manages roadmap state and topic progress
 */

import { create } from 'zustand';
import type { TopicProgress } from '@/types';

export interface RoadmapState {
  selectedCategory: string;
  topics: TopicProgress[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedCategory: (category: string) => void;
  setTopics: (topics: TopicProgress[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateTopic: (topicId: string, updates: Partial<TopicProgress>) => void;
}

export const useRoadmapStore = create<RoadmapState>((set) => ({
  selectedCategory: 'DSA',
  topics: [],
  isLoading: false,
  error: null,

  setSelectedCategory: (category: string) => set({ selectedCategory: category }),
  setTopics: (topics: TopicProgress[]) => set({ topics }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),

  updateTopic: (topicId: string, updates: Partial<TopicProgress>) => {
    set((state) => ({
      topics: state.topics.map((t) =>
        t.id === topicId ? { ...t, ...updates } : t
      ),
    }));
  },
}));
