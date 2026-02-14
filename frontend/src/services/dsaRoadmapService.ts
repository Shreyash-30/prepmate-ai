/**
 * DSA Roadmap Service
 * Specialized service for DSA roadmap with 4-layer structure,
 * weights for PCI calculation, and mastery tracking
 * 
 * Endpoint Base: /api/roadmap/dsa
 */

import { apiClient, ApiResponse } from './apiClient';

export interface DSALayerTopic {
  topic_id: string;
  canonical_topic_key: string;
  name: string;
  description: string;
  layer: 'core' | 'reinforcement' | 'advanced' | 'optional';
  weight: number;
  priority: number;
  order: number;
  interview_frequency_score: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
  estimated_hours: number;
  completion_threshold: number;
  concepts: string[];
  keywords: string[];
  resource_links: string[];
  problems_count: number;
  required_problems: number;
  user_mastery?: number;
  user_problems_solved?: number;
  user_confidence?: 'not_started' | 'weak' | 'improving' | 'strong';
}

export interface DSALayer {
  layer_name: 'core' | 'reinforcement' | 'advanced' | 'optional';
  layer_label: string;
  layer_description: string;
  layer_weight_percentage: number;
  topics: DSALayerTopic[];
  topicCount: number;
}

export interface DSARoadmapResponse {
  roadmap_id: string;
  roadmap_name: string;
  roadmap_description: string;
  roadmap_category: string;
  target_role: string;
  difficulty_level: string;
  estimated_duration_days: number;
  stats: {
    total_topics: number;
    total_estimated_hours: number;
    total_weight: number;
    average_interview_frequency: number;
  };
  layers: DSALayer[];
  pci_weights: {
    core_weight: number;
    reinforcement_weight: number;
    advanced_weight: number;
    optional_weight: number;
  };
  user_progress?: {
    total_topics_started: number;
    average_mastery: number;
  };
}

export interface DSATopicProblem {
  problem_id: string;
  external_id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  platform: string;
  url: string;
  description: string;
  constraints: string[];
  acceptance_rate: number;
  importance_score: number;
  recommended_order: number;
  prerequisites: string[];
}

export interface DSATopicProblemsResponse {
  topic_id: string;
  topic_name: string;
  problems: DSATopicProblem[];
  total_problems: number;
}

export interface DSATopicDetail {
  topic_id: string;
  canonical_topic_key: string;
  name: string;
  description: string;
  layer: string;
  weight: number;
  priority: number;
  order: number;
  interview_frequency_score: number;
  difficulty_level: string;
  estimated_hours: number;
  completion_threshold: number;
  concepts: string[];
  keywords: string[];
  resource_links: string[];
  prerequisite_topics: Array<{ topic_id: string; name: string }>;
  problems_count: number;
  required_problems: number;
  user_progress?: {
    topic_id: string;
    mastery: number;
    problems_solved: number;
    confidence: string;
    hours_spent: number;
    last_practiced: string | null;
  };
}

class DSARoadmapService {
  /**
   * GET /api/roadmap/dsa
   * Fetch complete DSA roadmap with 4-layer structure
   * Returns layered topics with weights for PCI calculation
   */
  async getFullDSARoadmap(): Promise<ApiResponse<DSARoadmapResponse>> {
    return apiClient.get<DSARoadmapResponse>('/roadmap/dsa');
  }

  /**
   * GET /api/roadmap/dsa/layers
   * Fetch roadmap grouped by layers with statistics
   * Useful for roadmap navigation and layer-based visualization
   */
  async getDSALayers(): Promise<ApiResponse<{
    roadmap_name: string;
    layers: DSALayer[];
  }>> {
    return apiClient.get('/roadmap/dsa/layers');
  }

  /**
   * GET /api/roadmap/dsa/topics
   * Fetch flattened list of DSA topics with optional filtering
   * Query params: layer (core|reinforcement|advanced|optional), difficulty (easy|medium|hard), search
   */
  async getDSATopics(options?: {
    layer?: 'core' | 'reinforcement' | 'advanced' | 'optional';
    difficulty?: 'easy' | 'medium' | 'hard';
    search?: string;
  }): Promise<ApiResponse<DSALayerTopic[]>> {
    const params: Record<string, string> = {};
    if (options?.layer) params.layer = options.layer;
    if (options?.difficulty) params.difficulty = options.difficulty;
    if (options?.search) params.search = options.search;

    return apiClient.get<DSALayerTopic[]>('/roadmap/dsa/topics', { params });
  }

  /**
   * GET /api/roadmap/dsa/topic/:topicId
   * Fetch detailed information for a specific DSA topic
   * Includes prerequisites, resources, and user progress
   */
  async getDSATopicDetail(topicId: string): Promise<ApiResponse<DSATopicDetail>> {
    return apiClient.get<DSATopicDetail>(`/roadmap/dsa/topic/${topicId}`);
  }

  /**
   * GET /api/roadmap/dsa/topic/:topicId/problems
   * Fetch problems for a specific DSA topic
   * Includes importance scores, difficulty, and platform information
   */
  async getDSATopicProblems(topicId: string): Promise<ApiResponse<DSATopicProblemsResponse>> {
    return apiClient.get<DSATopicProblemsResponse>(`/roadmap/dsa/topic/${topicId}/problems`);
  }

  /**
   * POST /api/roadmap/dsa/seed
   * Admin endpoint to seed/reseed the DSA roadmap
   * Requires admin role
   */
  async seedDSARoadmap(): Promise<ApiResponse<{ message: string; output: string }>> {
    return apiClient.post('/roadmap/dsa/seed', {});
  }
}

export const dsaRoadmapService = new DSARoadmapService();
