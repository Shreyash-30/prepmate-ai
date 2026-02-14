/**
 * Analytics Service
 * Handles performance tracking: heatmaps, scores, progress trajectories
 */

import { apiClient, ApiResponse } from './apiClient';

export interface HeatmapData {
  topic: string;
  mastery: number; // 0-100
}

export interface TrajectoryData {
  date: string;
  score: number;
}

class AnalyticsService {
  /**
   * Get topic mastery heatmap
   */
  async getHeatmapData(): Promise<ApiResponse<HeatmapData[]>> {
    return apiClient.get<HeatmapData[]>('/analytics/heatmap');
  }

  /**
   * Get score trajectory (last 30 days)
   */
  async getTrajectory(): Promise<ApiResponse<TrajectoryData[]>> {
    return apiClient.get<TrajectoryData[]>('/analytics/trajectory');
  }

  /**
   * Get strength/weakness breakdown
   */
  async getBreakdown(): Promise<ApiResponse<{ strong: string[]; weak: string[] }>> {
    return apiClient.get('/analytics/breakdown');
  }

  /**
   * Get time spent analysis
   */
  async getTimeSpent(): Promise<ApiResponse<{ total_hours: number; daily_average: number; weekly_total: number }>> {
    return apiClient.get('/analytics/time-spent');
  }
}

export const analyticsService = new AnalyticsService();
