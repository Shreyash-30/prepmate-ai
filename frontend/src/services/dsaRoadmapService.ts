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
   * Default empty roadmap response for graceful error handling
   */
  private getDefaultRoadmap(): DSARoadmapResponse {
    return {
      roadmap_id: '',
      roadmap_name: 'DSA Roadmap',
      roadmap_description: 'Data Structures & Algorithms Preparation',
      roadmap_category: 'DSA',
      target_role: 'Software Engineer',
      difficulty_level: 'intermediate',
      estimated_duration_days: 90,
      stats: {
        total_topics: 0,
        total_estimated_hours: 0,
        total_weight: 0,
        average_interview_frequency: 0,
      },
      layers: [],
      pci_weights: {
        core_weight: 0.4,
        reinforcement_weight: 0.35,
        advanced_weight: 0.2,
        optional_weight: 0.05,
      },
      user_progress: {
        total_topics_started: 0,
        average_mastery: 0,
      },
    };
  }

  /**
   * GET /api/roadmap/dsa
   * Fetch complete DSA roadmap with 4-layer structure
   * Returns layered topics with weights for PCI calculation
   */
  async getFullDSARoadmap(): Promise<DSARoadmapResponse> {
    try {
      const response = await apiClient.get<DSARoadmapResponse>('/roadmap/dsa');
      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching DSA roadmap:', error);
    }
    return this.getDefaultRoadmap();
  }

  /**
   * GET /api/roadmap/dsa/layers
   * Fetch roadmap grouped by layers with statistics
   * Useful for roadmap navigation and layer-based visualization
   */
  async getDSALayers(): Promise<{ roadmap_name: string; layers: DSALayer[] }> {
    try {
      const response = await apiClient.get<{ roadmap_name: string; layers: DSALayer[] }>('/roadmap/dsa/layers');
      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching DSA layers:', error);
    }
    return {
      roadmap_name: 'DSA Roadmap',
      layers: [],
    };
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
  }): Promise<DSALayerTopic[]> {
    try {
      const params: Record<string, string> = {};
      if (options?.layer) params.layer = options.layer;
      if (options?.difficulty) params.difficulty = options.difficulty;
      if (options?.search) params.search = options.search;

      const response = await apiClient.get<DSALayerTopic[]>('/roadmap/dsa/topics', { params });
      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching DSA topics:', error);
    }
    return [];
  }

  /**
   * GET /api/roadmap/dsa/topic/:topicId
   * Fetch detailed information for a specific DSA topic
   * Includes prerequisites, resources, and user progress
   */
  async getDSATopicDetail(topicId: string): Promise<DSATopicDetail | null> {
    try {
      const response = await apiClient.get<DSATopicDetail>(`/roadmap/dsa/topic/${topicId}`);
      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.error(`Error fetching DSA topic detail for ${topicId}:`, error);
    }
    return null;
  }

  /**
   * GET /api/roadmap/dsa/topic/:topicId/problems
   * Fetch problems for a specific DSA topic
   * Includes importance scores, difficulty, and platform information
   */
  async getDSATopicProblems(topicId: string): Promise<DSATopicProblemsResponse> {
    try {
      const response = await apiClient.get<DSATopicProblemsResponse>(`/roadmap/dsa/topic/${topicId}/problems`);
      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.error(`Error fetching problems for topic ${topicId}:`, error);
    }
    return {
      topic_id: topicId,
      topic_name: '',
      total_problems: 0,
      problems: [],
    };
  }

  /**
   * POST /api/roadmap/dsa/seed
   * Admin endpoint to seed/reseed the DSA roadmap
   * Requires admin role
   */
  async seedDSARoadmap(): Promise<{ message: string; output: string }> {
    try {
      const response = await apiClient.post<{ message: string; output: string }>('/roadmap/dsa/seed', {});
      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.error('Error seeding DSA roadmap:', error);
    }
    return {
      message: 'Failed to seed roadmap',
      output: '',
    };
  }
}

export const dsaRoadmapService = new DSARoadmapService();
