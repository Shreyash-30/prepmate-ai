/**
 * Intelligence Execution Panel
 * Displays today's task execution status, automation metrics, and compliance score
 * Shows real-time automation system status with visual indicators
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useTodaysTasks,
  useUserCompliance,
  useAutomationStatus,
} from '@/hooks/useAutomationHooks';
import { CheckCircle2, Clock, Target, Zap, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Circular Progress Meter Component
 */
const CircularMeter = ({
  value,
  max = 100,
  label,
  color = 'emerald',
}: {
  value: number;
  max?: number;
  label: string;
  color?: 'emerald' | 'blue' | 'purple' | 'amber';
}) => {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (percentage / 100) * circumference;

  const colorMap = {
    emerald: 'from-emerald-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    amber: 'from-amber-500 to-amber-600',
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-700" />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{Math.round(percentage)}%</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">{label}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Status Badge Component
 */
const StatusBadge = ({ status, label }: { status: 'active' | 'processing' | 'paused' | 'error'; label: string }) => {
  const statusConfig = {
    active: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    processing: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    paused: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };

  const statusDot = {
    active: 'bg-emerald-500',
    processing: 'bg-blue-500 animate-pulse',
    paused: 'bg-slate-500',
    error: 'bg-red-500',
  };

  return (
    <div className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium', statusConfig[status])}>
      <div className={cn('w-2 h-2 rounded-full', statusDot[status])} />
      {label}
    </div>
  );
};

export function IntelligenceExecutionPanel() {
  const { data: todaysTasks, isLoading: tasksLoading } = useTodaysTasks();
  const { data: compliance, isLoading: complianceLoading } = useUserCompliance();
  const { data: automationStatus, isLoading: statusLoading } = useAutomationStatus();
  const [taskCompletionPercent, setTaskCompletionPercent] = useState(0);

  // Calculate task completion percentage
  useEffect(() => {
    if (todaysTasks && Array.isArray(todaysTasks)) {
      const total = todaysTasks.length || 1;
      const completed = todaysTasks.filter((t: any) => t.completed).length;
      setTaskCompletionPercent((completed / total) * 100);
    }
  }, [todaysTasks]);

  const isLoading = tasksLoading || complianceLoading || statusLoading;

  // Determine automation status
  const automationActive = automationStatus?.status === 'healthy' || automationStatus?.queues?.processing > 0;
  const automationBeatColor = automationActive ? 'text-emerald-500' : 'text-slate-400';

  return (
    <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-900 hover:shadow-lg transition-shadow">
      <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-950/20 dark:to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            Execution Intelligence
          </CardTitle>
          {!isLoading && (
            <StatusBadge
              status={automationActive ? 'active' : 'paused'}
              label={automationActive ? 'Active' : 'Standby'}
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Task Completion Meter */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Today's Tasks
                </h3>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {Array.isArray(todaysTasks) ? todaysTasks.filter((t: any) => t.completed).length : 0} / {Array.isArray(todaysTasks) ? todaysTasks.length : 0}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <CircularMeter value={taskCompletionPercent} label="Completion" color="emerald" />
                <div className="flex-1 space-y-3">
                  {Array.isArray(todaysTasks) && todaysTasks.slice(0, 3).map((task: any, idx: number) => (
                    <div
                      key={task.id || idx}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className={cn(
                        'w-2 h-2 rounded-full transition-all',
                        task.completed ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{task.title || task.topicName}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{task.difficulty}</p>
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-400">{task.estimatedMinutes || 15}m</span>
                    </div>
                  ))}
                  {Array.isArray(todaysTasks) && (todaysTasks.length || 0) > 3 && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 px-2">
                      +{todaysTasks.length - 3} more tasks
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Compliance Score */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  Weekly Compliance
                </h3>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {compliance?.weeklyMetrics?.[0]?.compliancePercentage || 0}%
                </span>
              </div>
              <div className="flex items-center gap-6">
                <CircularMeter
                  value={compliance?.weeklyMetrics?.[0]?.compliancePercentage || 0}
                  label="Compliance"
                  color="blue"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Current Streak</span>
                    <span className="text-sm font-semibold text-foreground">{compliance?.currentStreak || 0} weeks</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Consistency Index</span>
                    <span className="text-sm font-semibold text-foreground">{Math.round(compliance?.consistencyIndex || 0)}%</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Improvement</span>
                    <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="h-3 w-3" />
                      {compliance?.weeklyMetrics?.[0]?.improvementTrend || '+0%'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Automation Heartbeat */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className={cn('w-3 h-3 rounded-full animate-pulse', automationBeatColor)} />
                <div>
                  <p className="text-sm font-medium text-foreground">Automation Heartbeat</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {automationActive ? 'System processing' : 'On standby'}
                  </p>
                </div>
              </div>
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
