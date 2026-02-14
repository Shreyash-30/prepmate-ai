/**
 * Mentor Service
 * Handles AI mentor interactions: chat history, responses, personalized advice
 */

import { apiClient, ApiResponse } from './apiClient';
import type { ChatMessage } from '@/types';

class MentorService {
  /**
   * Send message to AI mentor
   */
  async chat(message: string): Promise<ApiResponse<ChatMessage>> {
    return apiClient.post<ChatMessage>('/mentor/chat', { message });
  }

  /**
   * Get chat history
   */
  async getHistory(limit: number = 50): Promise<ApiResponse<ChatMessage[]>> {
    return apiClient.get<ChatMessage[]>('/mentor/history', { params: { limit } });
  }

  /**
   * Get personalized recommendations
   */
  async getRecommendations(): Promise<ApiResponse<{ focus_topics: string[]; suggested_problems: string[]; interview_tips: string[] }>> {
    return apiClient.get('/mentor/recommendations');
  }

  /**
   * Clear chat history
   */
  async clearHistory(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete('/mentor/history');
  }
}

export const mentorService = new MentorService();
