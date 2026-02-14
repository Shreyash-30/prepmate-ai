/**
 * Dashboard Service
 * Handles dashboard data: readiness score, tasks, weak topics, activity
 */

import { apiClient, ApiResponse } from './apiClient';
import type { ReadinessScore, Task, DailyActivity } from '@/types';

class DashboardService {
  /**
   * Get readiness score across all topics
   */
  async getReadiness(): Promise<ApiResponse<ReadinessScore>> {
    return apiClient.get<ReadinessScore>('/dashboard/readiness');
  }

  /**
   * Get today's tasks
   */
  async getTodayTasks(): Promise<ApiResponse<Task[]>> {
    return apiClient.get<Task[]>('/dashboard/tasks/today');
  }

  /**
   * Get weak topics
   */
  async getWeakTopics(): Promise<ApiResponse<string[]>> {
    return apiClient.get<string[]>('/dashboard/weak-topics');
  }

  /**
   * Get daily activity (last 30 days)
   */
  async getActivity(): Promise<ApiResponse<DailyActivity[]>> {
    return apiClient.get<DailyActivity[]>('/dashboard/activity');
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string): Promise<ApiResponse<Task>> {
    return apiClient.put<Task>(`/dashboard/tasks/${taskId}/complete`, {});
  }
}

export const dashboardService = new DashboardService();
