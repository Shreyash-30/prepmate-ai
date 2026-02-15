/**
 * useAutomationHooks.ts
 * TanStack Query hooks for automation data fetching
 * Integrates with backend automation layer - NO MOCK DATA
 * Polls every 5 minutes for latest data with JWT auth
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const TASK_POLL_INTERVAL = 60 * 1000; // 1 minute for task updates

// ============================================================================
// API Functions - Using apiClient with JWT auth
// ============================================================================

const automationAPI = {
  getStatus: async () => {
    const response = await apiClient.get<any>('/automation/status');
    return response.data?.data || response.data || {};
  },

  getCompliance: async () => {
    const response = await apiClient.get<any>('/user/compliance');
    return response.data?.data || response.data || {};
  },

  getTodaysTasks: async () => {
    const response = await apiClient.get<any>('/user/tasks/today');
    // API returns { data: { tasks: [...], summary: {...} } }
    const data = response.data?.data || response.data || {};
    return Array.isArray(data) ? data : (data.tasks || []);
  },

  getAllTasks: async (status?: string, limit?: number, page?: number) => {
    const params: Record<string, string | number> = {};
    if (status) params.status = status;
    if (limit) params.limit = limit;
    if (page) params.page = page;

    const response = await apiClient.get<any>('/user/tasks', { params });
    return response.data?.data || response.data || [];
  },

  completeTask: async (taskId: string, completionTimeMinutes?: number, score?: number) => {
    const response = await apiClient.post<any>(`/tasks/${taskId}/complete`, {
      completionTimeMinutes: completionTimeMinutes || 0,
      score: score || 100,
    });
    return response.data?.data || response.data || {};
  },

  bulkCompleteTasks: async (taskIds: string[], completionTime?: number, score?: number) => {
    const response = await apiClient.post<any>('/tasks/bulk/complete', {
      taskIds,
      completionTime: completionTime || 0,
      score: score || 100,
    });
    return response.data?.data || response.data || {};
  },

  triggerAdaptivePlan: async () => {
    const response = await apiClient.post<any>('/automation/trigger/planner', {});
    return response.data?.data || response.data || {};
  },

  triggerReadinessComputation: async () => {
    const response = await apiClient.post<any>('/automation/trigger/readiness', {});
    return response.data?.data || response.data || {};
  },
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook: Get automation system status
 */
export function useAutomationStatus() {
  return useQuery({
    queryKey: ['automation', 'status'],
    queryFn: automationAPI.getStatus,
    refetchInterval: POLL_INTERVAL,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook: Get user compliance data
 */
export function useUserCompliance() {
  return useQuery({
    queryKey: ['user', 'compliance'],
    queryFn: automationAPI.getCompliance,
    refetchInterval: POLL_INTERVAL,
    staleTime: 60000,
  });
}

/**
 * Hook: Get today's tasks
 */
export function useTodaysTasks() {
  return useQuery({
    queryKey: ['user', 'tasks', 'today'],
    queryFn: automationAPI.getTodaysTasks,
    refetchInterval: TASK_POLL_INTERVAL, // Poll every 1 minute for task updates
    staleTime: 30000,
  });
}

/**
 * Hook: Get all tasks with optional filtering
 */
export function useAllTasks(status?: string, limit?: number, page?: number) {
  return useQuery({
    queryKey: ['user', 'tasks', { status, limit, page }],
    queryFn: () => automationAPI.getAllTasks(status, limit, page),
    refetchInterval: POLL_INTERVAL,
    staleTime: 60000,
  });
}

/**
 * Hook: Complete a task mutation
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      completionTimeMinutes,
      score,
    }: {
      taskId: string;
      completionTimeMinutes: number;
      score: number;
    }) => automationAPI.completeTask(taskId, completionTimeMinutes, score),

    onSuccess: () => {
      // Refetch related queries
      queryClient.invalidateQueries({ queryKey: ['user', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'compliance'] });
    },
  });
}

/**
 * Hook: Bulk complete tasks mutation
 */
export function useBulkCompleteTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskIds,
      completionTime,
      score,
    }: {
      taskIds: string[];
      completionTime: number;
      score: number;
    }) => automationAPI.bulkCompleteTasks(taskIds, completionTime, score),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'compliance'] });
    },
  });
}

/**
 * Hook: Trigger adaptive plan generation
 */
export function useTriggerAdaptivePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: automationAPI.triggerAdaptivePlan,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'tasks'] });
    },
  });
}

/**
 * Hook: Trigger readiness computation
 */
export function useTriggerReadinessComputation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: automationAPI.triggerReadinessComputation,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'compliance'] });
    },
  });
}

// Export API client for direct use if needed
export { automationAPI };
export const AUTOMATION_POLL_INTERVAL = POLL_INTERVAL;
export const AUTOMATION_TASK_POLL_INTERVAL = TASK_POLL_INTERVAL;
