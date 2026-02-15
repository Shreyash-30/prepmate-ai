/**
 * User Data Service
 * Fetches user telemetry, submissions, and triggers ML processing
 * Called after successful login to initialize user-specific data
 */

import { apiClient } from './apiClient';
import { useAuthStore } from '@/store/authStore';

export interface UserTelemetry {
  totalSubmissions: number;
  totalScore: number;
  averageScore: number;
  topicsAttempted: string[];
  weakTopics: string[];
  strengths: string[];
  recentActivity: Array<{
    date: string;
    count: number;
    score: number;
  }>;
}

export interface UserMetrics {
  masteryScores: Record<string, number>;
  readinessScore: number;
  retentionIndex: number;
  weaknessSignals: Array<{
    topic: string;
    weakness: number;
    lastSeen: string;
  }>;
}

class UserDataService {
  /**
   * Fetch all user data after login
   * This data is fed to ML engines for calculations
   */
  async fetchUserDataAfterLogin(): Promise<void> {
    try {
      const authStore = useAuthStore.getState();
      if (!authStore.isAuthenticated || !authStore.user) {
        console.warn('UserDataService: User not authenticated');
        return;
      }

      console.log('[UserDataService] Fetching user telemetry after login...');

      // Fetch dashboard summary (includes user metrics and telemetry)
      const dashboardResponse = await this.fetchDashboardSummary();
      
      // Fetch submissions history for ML processing
      const submissionsResponse = await this.fetchUserSubmissions();

      // Fetch roadmap progress data for ML
      const roadmapResponse = await this.fetchRoadmapProgress();

      // Store in localStorage for quick access
      if (dashboardResponse) {
        localStorage.setItem('user_dashboard_data', JSON.stringify(dashboardResponse));
      }

      if (submissionsResponse) {
        localStorage.setItem('user_submissions', JSON.stringify(submissionsResponse));
      }

      if (roadmapResponse) {
        localStorage.setItem('user_roadmap_data', JSON.stringify(roadmapResponse));
      }

      console.log('[UserDataService] User data fetched and cached successfully');
    } catch (error) {
      console.error('[UserDataService] Error fetching user data:', error);
      // Don't throw - allow app to continue even if data fetch fails
    }
  }

  /**
   * Fetch dashboard summary data
   * Contains user metrics, mastery scores, readiness scores
   */
  async fetchDashboardSummary(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/summary');
      return response.data?.data || response.data || {};
    } catch (error: any) {
      console.error('[UserDataService] Error fetching dashboard summary:', error.message);
      return null;
    }
  }

  /**
   * Fetch user submissions for ML analysis
   * These submissions are used by ML models for weakness detection, mastery calculation, etc.
   */
  async fetchUserSubmissions(limit: number = 100): Promise<any> {
    try {
      const response = await apiClient.get('/submissions', {
        params: { limit, sort: '-createdAt' }
      });
      return response.data?.data || response.data || [];
    } catch (error: any) {
      console.error('[UserDataService] Error fetching submissions:', error.message);
      return [];
    }
  }

  /**
   * Fetch user's mastery scores (ML calculated metrics)
   */
  async fetchMasteryScores(): Promise<Record<string, number>> {
    try {
      const response = await apiClient.get('/dashboard/mastery-growth');
      return response.data?.data?.masteryScores || {};
    } catch (error: any) {
      console.error('[UserDataService] Error fetching mastery scores:', error.message);
      return {};
    }
  }

  /**
   * Fetch readiness score (ML calculated)
   */
  async fetchReadinessScore(): Promise<number> {
    try {
      const response = await apiClient.get('/dashboard/readiness');
      return response.data?.data?.readinessScore || 0;
    } catch (error: any) {
      console.error('[UserDataService] Error fetching readiness score:', error.message);
      return 0;
    }
  }

  /**
   * Fetch roadmap progress with problem completion stats
   * Returns completion rate, difficulty distribution, recent completions
   */
  async fetchRoadmapProgress(): Promise<any> {
    try {
      const response = await apiClient.get('/roadmap/progress');
      return response.data?.data || response.data || {};
    } catch (error: any) {
      console.error('[UserDataService] Error fetching roadmap progress:', error.message);
      return null;
    }
  }

  /**
   * Fetch roadmap trends (completion history over time)
   */
  async fetchRoadmapTrends(): Promise<any[]> {
    try {
      const response = await apiClient.get('/roadmap/trends');
      return response.data?.data || [];
    } catch (error: any) {
      console.error('[UserDataService] Error fetching roadmap trends:', error.message);
      return [];
    }
  }

  /**
   * Fetch recent problem completions (last 7 days)
   */
  async fetchRecentCompletions(): Promise<any[]> {
    try {
      const response = await apiClient.get('/roadmap/completions/recent');
      return response.data?.data || [];
    } catch (error: any) {
      console.error('[UserDataService] Error fetching recent completions:', error.message);
      return [];
    }
  }

  /**
   * Fetch roadmap difficulty distribution (solved by difficulty level)
   */
  async fetchDifficultyDistribution(): Promise<any> {
    try {
      const response = await apiClient.get('/roadmap/difficulty-distribution');
      return response.data?.data || {};
    } catch (error: any) {
      console.error('[UserDataService] Error fetching difficulty distribution:', error.message);
      return {};
    }
  }

  /**
   * Trigger ML processing for new user data
   * Calls backend endpoints to run ML algorithms on user telemetry
   */
  async triggerMLProcessing(): Promise<void> {
    try {
      console.log('[UserDataService] Triggering ML processing...');

      // Trigger adaptive planning
      await apiClient.post('/automation/trigger/planner', {});

      // Trigger readiness computation
      await apiClient.post('/automation/trigger/readiness', {});

      console.log('[UserDataService] ML processing triggered successfully');
    } catch (error: any) {
      console.error('[UserDataService] Error triggering ML processing:', error.message);
      // Don't throw - ML is optional for UI to work
    }
  }

  /**
   * Get cached user data from localStorage
   */
  getCachedDashboardData(): any {
    try {
      const cached = localStorage.getItem('user_dashboard_data');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('[UserDataService] Error parsing cached dashboard data:', error);
      return null;
    }
  }

  /**
   * Get cached submissions from localStorage
   */
  getCachedSubmissions(): any[] {
    try {
      const cached = localStorage.getItem('user_submissions');
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('[UserDataService] Error parsing cached submissions:', error);
      return [];
    }
  }

  /**
   * Get cached roadmap data from localStorage
   */
  getCachedRoadmapData(): any {
    try {
      const cached = localStorage.getItem('user_roadmap_data');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('[UserDataService] Error parsing cached roadmap data:', error);
      return null;
    }
  }

  /**
   * Clear cached user data on logout
   */
  clearCachedData(): void {
    localStorage.removeItem('user_dashboard_data');
    localStorage.removeItem('user_submissions');
    localStorage.removeItem('user_roadmap_data');
  }
}

export const userDataService = new UserDataService();
