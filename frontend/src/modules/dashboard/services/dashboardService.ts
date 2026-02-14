/**
 * Dashboard Service
 * Handles all dashboard API calls and data fetching with TanStack Query integration
 * Uses real MongoDB telemetry data from backend
 */

import { apiClient, ApiResponse } from '@/services/apiClient';

export interface DashboardSummary {
  totalProblemsSolved: number;
  problemsSolvedLast7Days: number;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  syncedPlatforms: Array<{
    name: string;
    connected: boolean;
    username?: string;
    problemsSynced: number;
    lastSync?: string;
  }>;
  readinessScore: number;
  readinessLevel: string;
}

export interface ActivityData {
  date: string;
  problemsSolved: number;
  totalAttempts: number;
  avgSolveTime: number;
}

export interface RecentSubmission {
  id: string;
  title: string;
  platform: string;
  difficulty: string;
  solved: boolean;
  timestamp: string;
  attempts: number;
}

export interface DashboardActivity {
  timeline: ActivityData[];
  recentSubmissions: RecentSubmission[];
}

export interface WeakTopic {
  topicName: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  mistakeRate: string;
  signalTypes: string[];
}

export interface UpcomingRevision {
  topicName: string;
  scheduledDate: string;
  priority: string;
}

export interface DashboardIntelligence {
  readinessScore: number;
  readinessLevel: string;
  preparationCompletenessIndex: number;
  totalTopics: number;
  masteredTopics: number;
  consistencyScore: number;
  submissionsLast7Days: number;
  submissionsLast14Days: number;
  submissionsLast30Days: number;
  improvementVelocity: number;
  velocityTrend: 'improving' | 'declining' | 'stable';
  weakTopics: WeakTopic[];
  upcomingRevisions: UpcomingRevision[];
}

export interface Task {
  id: string;
  title: string;
  type: 'practice' | 'revision' | 'roadmap' | 'mock';
  topicName: string;
  priority: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedMinutes: number;
  completed: boolean;
}

export interface ReadinessTrendPoint {
  date: string;
  score: number;
}

export interface MasteryTopic {
  topic: string;
  mastery: number;
  problemsSolved: number;
  lastUpdated?: string;
}

class DashboardService {
  /**
   * Fetch dashboard summary
   * High-level overview: problems solved, platforms synced, completion metrics
   */
  async fetchDashboardSummary(): Promise<DashboardSummary> {
    try {
      const response = await apiClient.get<any>('/dashboard/summary');
      if (response.success && response.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
    }
    // Return default/empty data instead of throwing
    return {
      totalProblemsSolved: 0,
      problemsSolvedLast7Days: 0,
      difficultyDistribution: { easy: 0, medium: 0, hard: 0 },
      syncedPlatforms: [],
      readinessScore: 0,
      readinessLevel: 'not-started',
    };
  }

  /**
   * Fetch activity data
   * Real activity timeline: submissions over time
   */
  async fetchDashboardActivity(days: number = 7): Promise<DashboardActivity> {
    try {
      const response = await apiClient.get<any>('/dashboard/activity', {
        params: { days: String(days) },
      });
      if (response.success && response.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching dashboard activity:', error);
    }
    // Return default/empty data instead of throwing
    return {
      timeline: [],
      recentSubmissions: [],
    };
  }

  /**
   * Fetch intelligence data
   * AI-powered intelligence: readiness, completeness, consistency, improvement velocity
   */
  async fetchDashboardIntelligence(): Promise<DashboardIntelligence> {
    try {
      const response = await apiClient.get<any>('/dashboard/intelligence');
      if (response.success && response.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching dashboard intelligence:', error);
    }
    // Return default/empty data instead of throwing
    return {
      readinessScore: 0,
      readinessLevel: 'not-started',
      preparationCompletenessIndex: 0,
      totalTopics: 0,
      masteredTopics: 0,
      consistencyScore: 0,
      submissionsLast7Days: 0,
      submissionsLast14Days: 0,
      submissionsLast30Days: 0,
      improvementVelocity: 0,
      velocityTrend: 'stable',
      weakTopics: [],
      upcomingRevisions: [],
    };
  }

  /**
   * Fetch today's tasks
   * Real tasks from database with weak topic recommendations
   */
  async fetchTodayTasks(): Promise<Task[]> {
    try {
      const response = await apiClient.get<any>('/dashboard/today-tasks');
      if (response.success && response.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching today tasks:', error);
    }
    // Return default/empty data instead of throwing
    return [];
  }

  /**
   * Fetch readiness trend
   * Historical readiness trend for chart visualization
   */
  async fetchReadinessTrend(days: number = 30): Promise<ReadinessTrendPoint[]> {
    try {
      const response = await apiClient.get<any>('/dashboard/readiness-trend', {
        params: { days: String(days) },
      });
      if (response.success && response.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching readiness trend:', error);
    }
    // Return default/empty data instead of throwing
    return [];
  }

  /**
   * Fetch mastery growth
   * Mastery progression by topic
   */
  async fetchMasteryGrowth(): Promise<MasteryTopic[]> {
    try {
      const response = await apiClient.get<any>('/dashboard/mastery-growth');
      if (response.success && response.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching mastery growth:', error);
    }
    // Return default/empty data instead of throwing
    return [];
  }
}

export const dashboardService = new DashboardService();
