/**
 * Analytics Store
 * Manages analytics and performance data
 */

import { create } from 'zustand';
import type { HeatmapData, TrajectoryData } from '@/services/analyticsService';

export interface AnalyticsState {
  heatmapData: HeatmapData[];
  trajectoryData: TrajectoryData[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setHeatmapData: (data: HeatmapData[]) => void;
  setTrajectoryData: (data: TrajectoryData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  heatmapData: [],
  trajectoryData: [],
  isLoading: false,
  error: null,

  setHeatmapData: (data: HeatmapData[]) => set({ heatmapData: data }),
  setTrajectoryData: (data: TrajectoryData[]) => set({ trajectoryData: data }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  clear: () => set({
    heatmapData: [],
    trajectoryData: [],
    isLoading: false,
    error: null,
  }),
}));
