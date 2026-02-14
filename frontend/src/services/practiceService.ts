/**
 * Practice Service
 * Handles coding practice data: problems, solutions, submissions
 */

import { apiClient, ApiResponse } from './apiClient';
import type { Problem, PaginatedResponse } from '@/types';

export interface ProblemFilters {
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  status?: 'solved' | 'unsolved';
  page?: number;
  limit?: number;
}

class PracticeService {
  /**
   * Get practice problems with optional filters
   */
  async getProblems(filters?: ProblemFilters): Promise<ApiResponse<Problem[]>> {
    return apiClient.get<Problem[]>('/practice/problems', { params: filters });
  }

  /**
   * Get single problem details
   */
  async getProblem(problemId: string): Promise<ApiResponse<Problem & { description?: string; hints?: string[] }>> {
    return apiClient.get(`/practice/problems/${problemId}`);
  }

  /**
   * Submit code solution
   */
  async submitSolution(problemId: string, code: string, language: string): Promise<ApiResponse<{ passed: boolean; testsPassed: number; totalTests: number; feedback?: string }>> {
    return apiClient.post(`/practice/problems/${problemId}/submit`, { code, language });
  }

  /**
   * Get hint for problem
   */
  async getHint(problemId: string): Promise<ApiResponse<{ hint: string }>> {
    return apiClient.get(`/practice/problems/${problemId}/hint`);
  }

  /**
   * Mark problem as solved
   */
  async markSolved(problemId: string): Promise<ApiResponse<Problem>> {
    return apiClient.put(`/practice/problems/${problemId}/solved`, {});
  }
}

export const practiceService = new PracticeService();
