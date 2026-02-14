/**
 * Roadmap Service
 * Handles learning roadmap data: topics, progress, categories
 */

import { apiClient, ApiResponse } from './apiClient';
import type { TopicProgress } from '@/types';

class RoadmapService {
  /**
   * Get topics by category
   */
  async getTopics(category: string): Promise<ApiResponse<TopicProgress[]>> {
    return apiClient.get<TopicProgress[]>(`/roadmap/topics`, { params: { category } });
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<ApiResponse<string[]>> {
    return apiClient.get<string[]>('/roadmap/categories');
  }

  /**
   * Update topic mastery
   */
  async updateTopicProgress(topicId: string, data: Partial<TopicProgress>): Promise<ApiResponse<TopicProgress>> {
    return apiClient.put<TopicProgress>(`/roadmap/topics/${topicId}`, data);
  }
}

export const roadmapService = new RoadmapService();
