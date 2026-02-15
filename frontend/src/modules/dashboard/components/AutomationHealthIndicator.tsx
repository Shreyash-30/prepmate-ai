/**
 * Automation Health Indicator
 * Shows real-time status of all automation pipelines
 * Displays queue stats and scheduler status
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAutomationStatus } from '@/hooks/useAutomationHooks';
import { Activity, BarChart3, GitCommit, HeartHandshake } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Status Indicator Light
 */
const StatusLight = ({ status }: { status: 'healthy' | 'degraded' | 'offline' | 'processing' }) => {
  const statusConfig = {
    healthy: 'bg-emerald-500',
    degraded: 'bg-amber-500',
    offline: 'bg-red-500',
    processing: 'bg-blue-500 animate-pulse',
  };

  return (
    <div className={cn('w-3 h-3 rounded-full', statusConfig[status])} />
  );
};

/**
 * Queue Stats Row
 */
const QueueStatsRow = ({
  label,
  value,
  icon: Icon,
  color = 'slate',
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color?: 'emerald' | 'blue' | 'slate' | 'red';
}) => {
  const colorMap = {
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30',
    slate: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800',
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30',
  };

  return (
    <div className={cn('flex items-center justify-between p-3 rounded-lg', colorMap[color])}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/50 dark:bg-slate-800/50">
          {Icon}
        </div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <span className="text-lg font-bold text-foreground">{value}</span>
    </div>
  );
};

/**
 * Scheduler Status Item
 */
const SchedulerStatus = ({
  name,
  status,
  lastRun,
}: {
  name: string;
  status: 'enabled' | 'disabled' | 'running' | 'error';
  lastRun?: string;
}) => {
  const statusConfig = {
    enabled: { light: 'healthy', label: 'Running', color: 'emerald' },
    disabled: { light: 'offline', label: 'Disabled', color: 'slate' },
    running: { light: 'processing', label: 'Executing', color: 'blue' },
    error: { light: 'degraded', label: 'Error', color: 'red' },
  } as const;

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3 flex-1">
        <StatusLight status={config.light as any} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{name}</p>
          {lastRun && (
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{lastRun}</p>
          )}
        </div>
      </div>
      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 whitespace-nowrap">
        {config.label}
      </span>
    </div>
  );
};

export function AutomationHealthIndicator() {
  const { data: status, isLoading } = useAutomationStatus();

  // Determine overall health
  const overallHealth =
    status?.status === 'healthy'
      ? 'healthy'
      : (status?.queues?.failed || 0) > 5
        ? 'degraded'
        : 'offline';

  if (isLoading) {
    return (
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-500" />
            Automation Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-900">
      <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-cyan-50/50 to-transparent dark:from-cyan-950/20 dark:to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-500" />
            Automation Health
          </CardTitle>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800">
            <StatusLight status={overallHealth} />
            {overallHealth.charAt(0).toUpperCase() + overallHealth.slice(1)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Queue Statistics */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            Queue Statistics
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <QueueStatsRow
              label="Processing"
              value={status?.queues?.processing || 0}
              icon={<Activity className="h-4 w-4" />}
              color="blue"
            />
            <QueueStatsRow
              label="Pending"
              value={status?.queues?.pending || 0}
              icon={<GitCommit className="h-4 w-4" />}
              color="slate"
            />
            <QueueStatsRow
              label="Completed"
              value={status?.queues?.completed || 0}
              icon={<HeartHandshake className="h-4 w-4" />}
              color="emerald"
            />
            {(status?.queues?.failed || 0) > 0 && (
              <QueueStatsRow
                label="Failed"
                value={status.queues.failed}
                icon={<Activity className="h-4 w-4" />}
                color="red"
              />
            )}
          </div>
        </div>

        {/* Scheduler Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-purple-500" />
            Scheduler Status
          </h3>
          <div className="space-y-2">
            <SchedulerStatus
              name="Daily Planner"
              status={status?.schedulers?.['daily-planner']?.enabled ? 'enabled' : 'disabled'}
              lastRun={status?.schedulers?.['daily-planner']?.lastRun}
            />
            <SchedulerStatus
              name="Retention Scheduler"
              status={status?.schedulers?.retention?.enabled ? 'enabled' : 'disabled'}
              lastRun={status?.schedulers?.retention?.lastRun}
            />
            <SchedulerStatus
              name="Weekly Readiness"
              status={status?.schedulers?.['weekly-readiness']?.enabled ? 'enabled' : 'disabled'}
              lastRun={status?.schedulers?.['weekly-readiness']?.lastRun}
            />
            <SchedulerStatus
              name="Weekly Compliance"
              status={status?.schedulers?.['weekly-compliance']?.enabled ? 'enabled' : 'disabled'}
              lastRun={status?.schedulers?.['weekly-compliance']?.lastRun}
            />
          </div>
        </div>

        {/* Error Message if Degraded */}
        {overallHealth === 'degraded' && (
          <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-950/20">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              ⚠️ Automation system is degraded. {status?.queues?.failed || 0} failed jobs detected.
            </p>
          </div>
        )}

        {overallHealth === 'offline' && (
          <div className="p-4 rounded-lg border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20">
            <p className="text-sm text-red-800 dark:text-red-200">
              ❌ Automation system is offline. Check backend connection.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
