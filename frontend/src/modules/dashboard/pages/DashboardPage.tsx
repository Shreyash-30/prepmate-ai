/**
 * Dashboard Page - Production-Grade SaaS Intelligence Dashboard
 * Powered by real MongoDB telemetry and AI outputs
 * Shows preparation status, progress, and actionable intelligence
 */

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useCallback, useEffect } from 'react';
import { dashboardService } from '@/modules/dashboard/services/dashboardService';
import { useDashboardStore } from '@/modules/dashboard/store/dashboardStore';
import { IntelligenceHeader } from '@/modules/dashboard/components/IntelligenceHeader';
import { PlatformSyncCard } from '@/modules/dashboard/components/PlatformSyncCard';
import { TodayTasksPanel } from '@/modules/dashboard/components/TodayTasksPanel';
import { WeakTopicsCard } from '@/modules/dashboard/components/WeakTopicsCard';
import { ActivityChart } from '@/modules/dashboard/components/ActivityChart';
import { ReadinessTrendChart } from '@/modules/dashboard/components/ReadinessTrendChart';
import { MasteryChart } from '@/modules/dashboard/components/MasteryChart';
import { RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { refreshTrigger, setLoadingSync } = useDashboardStore();

  // Fetch all dashboard data with TanStack Query
  const { data: summaryData, isLoading: isSummaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['dashboard/summary'],
    queryFn: dashboardService.fetchDashboardSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: activityData, isLoading: isActivityLoading } = useQuery({
    queryKey: ['dashboard/activity', 7],
    queryFn: () => dashboardService.fetchDashboardActivity(7),
    staleTime: 10 * 60 * 1000,
  });

  const { data: intelligenceData, isLoading: isIntelligenceLoading } = useQuery({
    queryKey: ['dashboard/intelligence'],
    queryFn: dashboardService.fetchDashboardIntelligence,
    staleTime: 5 * 60 * 1000,
  });

  const { data: tasksData, isLoading: isTasksLoading } = useQuery({
    queryKey: ['dashboard/today-tasks'],
    queryFn: dashboardService.fetchTodayTasks,
    staleTime: 10 * 60 * 1000,
  });

  const { data: trendData, isLoading: isTrendLoading } = useQuery({
    queryKey: ['dashboard/readiness-trend', 30],
    queryFn: () => dashboardService.fetchReadinessTrend(30),
    staleTime: 30 * 60 * 1000,
  });

  const { data: masteryData, isLoading: isMasteryLoading } = useQuery({
    queryKey: ['dashboard/mastery-growth'],
    queryFn: dashboardService.fetchMasteryGrowth,
    staleTime: 15 * 60 * 1000,
  });

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setLoadingSync(true);
    try {
      await refetchSummary();
    } finally {
      setLoadingSync(false);
    }
  }, [refetchSummary, setLoadingSync]);

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {greeting}, {user?.name?.split(' ')[0]} 👋
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
                Your AI-powered interview preparation dashboard
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors group"
              title="Refresh dashboard data"
            >
              <RefreshCw className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 group-hover:animate-spin" />
            </button>
          </div>
        </div>

        <div className="space-y-6 lg:space-y-8">
          {/* 1. Intelligence Header - Main Metrics */}
          <IntelligenceHeader
            readinessScore={intelligenceData?.readinessScore || 0}
            readinessLevel={intelligenceData?.readinessLevel || 'not-ready'}
            completenessIndex={intelligenceData?.preparationCompletenessIndex || 0}
            consistencyScore={intelligenceData?.consistencyScore || 0}
            improvementVelocity={intelligenceData?.improvementVelocity || 0}
            velocityTrend={intelligenceData?.velocityTrend || 'stable'}
            isLoading={isIntelligenceLoading}
          />

          {/* 2. Three-Column Layout: Platform Sync, Tasks, Weak Topics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Platform Sync Card */}
            <div className="lg:col-span-1">
              <PlatformSyncCard
                platforms={summaryData?.syncedPlatforms || []}
                difficultyDistribution={summaryData?.difficultyDistribution || { easy: 0, medium: 0, hard: 0 }}
                isLoading={isSummaryLoading}
                onRefresh={handleRefresh}
              />
            </div>

            {/* Today's Tasks Panel */}
            <div className="lg:col-span-1">
              <TodayTasksPanel
                tasks={tasksData || []}
                isLoading={isTasksLoading}
                onTaskStartClick={(task) => {
                  // Navigate to practice page with topic filter
                  console.log('Starting task:', task.topicName);
                }}
              />
            </div>

            {/* Weak Topics Card */}
            <div className="lg:col-span-1">
              <WeakTopicsCard
                topics={intelligenceData?.weakTopics || []}
                isLoading={isIntelligenceLoading}
                onPracticeClick={(topicName) => {
                  // Navigate to practice page with weak topic filter
                  console.log('Practice weak topic:', topicName);
                }}
              />
            </div>
          </div>

          {/* 3. Charts Section - Activity and Trend Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Chart */}
            <ActivityChart
              data={activityData?.timeline || []}
              isLoading={isActivityLoading}
            />

            {/* Readiness Trend Chart */}
            <ReadinessTrendChart
              data={trendData || []}
              isLoading={isTrendLoading}
            />
          </div>

          {/* 4. Mastery Growth Chart - Full Width */}
          <MasteryChart
            data={masteryData || []}
            isLoading={isMasteryLoading}
          />

          {/* 5. Recent Activity Feed - Optional */}
          {activityData?.recentSubmissions && activityData.recentSubmissions.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-gradient-to-r from-cyan-50/50 to-transparent dark:from-cyan-950/20 dark:to-transparent">
                <h3 className="font-semibold text-foreground">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {activityData.recentSubmissions.slice(0, 5).map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-all"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">{submission.title}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {submission.platform} · {submission.difficulty} · {submission.attempts} attempt(s)
                        </p>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        {submission.solved ? (
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                            ✓ Solved
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
