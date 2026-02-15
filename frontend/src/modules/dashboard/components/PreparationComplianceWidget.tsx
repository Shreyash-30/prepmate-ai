/**
 * Preparation Compliance Widget
 * Displays weekly compliance metrics, streaks, and consistency
 * Shows real data from backend compliance calculations
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserCompliance } from '@/hooks/useAutomationHooks';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Award, Calendar, TrendingUp, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Stat Card Component
 */
const StatCard = ({
  icon: Icon,
  label,
  value,
  unit,
  color = 'blue',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  color?: 'emerald' | 'blue' | 'purple' | 'amber';
}) => {
  const bgMap = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30',
    blue: 'bg-blue-50 dark:bg-blue-950/30',
    purple: 'bg-purple-50 dark:bg-purple-950/30',
    amber: 'bg-amber-50 dark:bg-amber-950/30',
  };

  const iconColorMap = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    amber: 'text-amber-600 dark:text-amber-400',
  };

  return (
    <div className={cn('p-4 rounded-lg border border-slate-200 dark:border-slate-700', bgMap[color])}>
      <div className="flex items-center gap-3 mb-2">
        <div className={cn('w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-900/50', iconColorMap[color])}>
          {Icon}
        </div>
        <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">
        {value}
        {unit && <span className="text-sm text-slate-600 dark:text-slate-400 ml-1">{unit}</span>}
      </div>
    </div>
  );
};

export function PreparationComplianceWidget() {
  const { data: compliance, isLoading } = useUserCompliance();

  if (isLoading) {
    return (
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Compliance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  // Get weekly data for chart
  const weeklyData = compliance?.weeklyMetrics?.slice(0, 4).reverse() || [];
  const chartData = weeklyData.map((week: any, idx: number) => ({
    week: `Week ${4 - idx}`,
    compliance: week.compliancePercentage || 0,
    tasks: week.totalTasksCompleted || 0,
  }));

  // Get streak info
  const currentStreak = compliance?.currentStreak || 0;
  const bestStreak = compliance?.longestStreak || 0;
  const consistencyIndex = Math.round(compliance?.consistencyIndex || 0);

  // Get average metrics
  const avgCompletionTime = compliance?.avgTaskCompletionTime || 0;
  const avgScore = Math.round(compliance?.avgTaskScore || 0);

  // Determine compliance status
  const compliancePercent = compliance?.weeklyMetrics?.[0]?.compliancePercentage || 0;
  const complianceStatus =
    compliancePercent >= 80
      ? 'excellent'
      : compliancePercent >= 60
        ? 'good'
        : compliancePercent >= 40
          ? 'fair'
          : 'poor';

  const statusConfig = {
    excellent: { color: 'emerald', label: 'Excellent' },
    good: { color: 'blue', label: 'Good' },
    fair: { color: 'amber', label: 'Fair' },
    poor: { color: 'red', label: 'Poor' },
  } as const;

  const config = statusConfig[complianceStatus];

  return (
    <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-900">
      <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20 dark:to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Compliance Metrics
          </CardTitle>
          <div className={cn(
            'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold',
            config.color === 'emerald' && 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
            config.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
            config.color === 'amber' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
            config.color === 'red' && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
          )}>
            {config.label}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Key Stat Cards */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Target className="h-4 w-4" />}
            label="Current Compliance"
            value={Math.round(compliancePercent)}
            unit="%"
            color="blue"
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Consistency"
            value={consistencyIndex}
            unit="%"
            color="purple"
          />
          <StatCard
            icon={<Award className="h-4 w-4" />}
            label="Current Streak"
            value={currentStreak}
            unit="wks"
            color="emerald"
          />
        </div>

        {/* Weekly Compliance Chart */}
        {chartData.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              Weekly Compliance Trend
            </h3>
            <div className="h-48 rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-800/20">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Bar dataKey="compliance" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        {/* Streak Information */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Current Streak</p>
            <p className="text-2xl font-bold text-foreground mt-1">{currentStreak}w</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">consecutive weeks</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Best Streak</p>
            <p className="text-2xl font-bold text-foreground mt-1">{bestStreak}w</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">personal record</p>
          </div>
        </div>

        {/* Average Task Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs text-slate-600 dark:text-slate-400">Avg Task Time</p>
            <p className="text-lg font-bold text-foreground mt-1">{Math.round(avgCompletionTime)}m</p>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs text-slate-600 dark:text-slate-400">Avg Task Score</p>
            <p className="text-lg font-bold text-foreground mt-1">{avgScore}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
