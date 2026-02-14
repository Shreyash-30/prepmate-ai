/**
 * Dashboard Store
 * Zustand store for dashboard state management
 * Handles filters, refresh triggers, and dashboard-specific state
 */

import { create } from 'zustand';

export interface DashboardFilters {
  activityDays: 7 | 14 | 30;
  trendDays: 7 | 14 | 30;
  platformFilter?: string;
  difficultyFilter?: 'easy' | 'medium' | 'hard';
}

export interface DashboardStore {
  // State
  filters: DashboardFilters;
  refreshTrigger: number;
  isLoadingSync: boolean;

  // Actions
  setFilters: (filters: Partial<DashboardFilters>) => void;
  setActivityDays: (days: 7 | 14 | 30) => void;
  setTrendDays: (days: 7 | 14 | 30) => void;
  setPlatformFilter: (platform: string | undefined) => void;
  setDifficultyFilter: (difficulty: 'easy' | 'medium' | 'hard' | undefined) => void;
  triggerRefresh: () => void;
  setLoadingSync: (loading: boolean) => void;
}

const initialFilters: DashboardFilters = {
  activityDays: 7,
  trendDays: 30,
};

export const useDashboardStore = create<DashboardStore>((set) => ({
  // Initial state
  filters: initialFilters,
  refreshTrigger: 0,
  isLoadingSync: false,

  // Actions
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  setActivityDays: (days) =>
    set((state) => ({
      filters: { ...state.filters, activityDays: days },
    })),

  setTrendDays: (days) =>
    set((state) => ({
      filters: { ...state.filters, trendDays: days },
    })),

  setPlatformFilter: (platform) =>
    set((state) => ({
      filters: { ...state.filters, platformFilter: platform },
    })),

  setDifficultyFilter: (difficulty) =>
    set((state) => ({
      filters: { ...state.filters, difficultyFilter: difficulty },
    })),

  triggerRefresh: () =>
    set((state) => ({
      refreshTrigger: state.refreshTrigger + 1,
    })),

  setLoadingSync: (loading) =>
    set({
      isLoadingSync: loading,
    }),
}));
