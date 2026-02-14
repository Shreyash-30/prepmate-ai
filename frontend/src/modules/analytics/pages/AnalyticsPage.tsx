/**
 * Analytics Page - Premium SaaS Design
 * Deep insights into preparation progress and performance
 */

import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analyticsService';
import { SectionHeader, MetricCard, ChartCard } from '@/components/ui/design-system';
import { BarChart3, TrendingUp, Trophy, Zap } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<'7' | '30' | '90'>('30');

  const { data: heatmapQuery } = useQuery({
    queryKey: ['heatmap'],
    queryFn: analyticsService.getHeatmapData,
  });
  const { data: trajectoryQuery } = useQuery({
    queryKey: ['trajectory'],
    queryFn: analyticsService.getTrajectory,
  });

  const heatmapData = heatmapQuery?.data || [];
  const trajectoryData = trajectoryQuery?.data || [];

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 80) return 'bg-success-100 dark:bg-success-900/40 border-success-200 dark:border-success-700/50';
    if (mastery >= 60) return 'bg-primary-100 dark:bg-primary-900/40 border-primary-200 dark:border-primary-700/50';
    if (mastery >= 40) return 'bg-warning-100 dark:bg-warning-900/40 border-warning-200 dark:border-warning-700/50';
    return 'bg-destructive/10 dark:bg-destructive/20 border-destructive/30 dark:border-destructive/40';
  };

  const getMasteryTextColor = (mastery: number) => {
    if (mastery >= 80) return 'text-success';
    if (mastery >= 60) return 'text-primary';
    if (mastery >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const avgMastery = heatmapData.length > 0 
    ? Math.round(heatmapData.reduce((sum: number, item: any) => sum + item.mastery, 0) / heatmapData.length)
    : 0;

  const dailyStreak = 12;
  const totalHours = 47;
  const problemsSolved = 156;

  return (
    <div className="space-y-6 lg:space-y-8">
      <SectionHeader
        title="Analytics & Insights"
        subtitle="Track your preparation progress with detailed performance metrics"
        action={
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{avgMastery}%</p>
            <p className="text-xs text-muted-foreground">Average Mastery</p>
          </div>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Daily Streak"
          value={dailyStreak.toString()}
          subtitle="days"
          icon="🔥"
          trend={2}
          className="bg-warning-50/50 dark:bg-warning-900/20"
        />
        <MetricCard
          title="Study Hours"
          value={totalHours.toString()}
          subtitle="total hours"
          icon="⏱️"
          className="bg-primary-50/50 dark:bg-primary-900/20"
        />
        <MetricCard
          title="Problems Solved"
          value={problemsSolved.toString()}
          subtitle="total problems"
          icon="✅"
          trend={8}
          className="bg-success-50/50 dark:bg-success-900/20"
        />
        <MetricCard
          title="Avg Mastery"
          value={avgMastery.toString()}
          subtitle="percent"
          icon="🎯"
          className="bg-primary-50/50 dark:bg-primary-900/20"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Mastery Heatmap */}
        <ChartCard
          title="Topic Mastery Breakdown"
          subtitle="Current proficiency across topics"
        >
          <div className="space-y-4">
            {heatmapData.map((item: any) => (
              <div key={item.topic} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.topic}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Last practiced: {new Date(item.last_practiced).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className={cn(
                    'font-bold text-sm rounded-full px-3 py-1',
                    getMasteryTextColor(item.mastery),
                    getMasteryColor(item.mastery),
                    'border'
                  )}>
                    {item.mastery}%
                  </span>
                </div>
                <div className="h-2.5 bg-border/30 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      item.mastery >= 80 ? 'bg-gradient-to-r from-success to-success-600' :
                      item.mastery >= 60 ? 'bg-gradient-to-r from-primary to-primary-600' :
                      item.mastery >= 40 ? 'bg-gradient-to-r from-warning to-warning-600' :
                      'bg-gradient-to-r from-destructive to-destructive-600'
                    )}
                    style={{ width: `${item.mastery}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Score Trajectory */}
        <ChartCard
          title="Score Trajectory"
          subtitle={`Last ${timeframe} days`}
          action={
            <div className="flex gap-1">
              {[
                { label: '7d', value: '7' },
                { label: '30d', value: '30' },
                { label: '90d', value: '90' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTimeframe(opt.value as any)}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium transition-colors',
                    timeframe === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 text-foreground hover:bg-secondary'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          }
        >
          <div className="flex items-end gap-1 h-48 justify-between">
            {trajectoryData
              .slice(parseInt(timeframe) * -1)
              .map((d: any, idx: number) => (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center gap-1 group"
                  title={`${d.date}: ${d.score}%`}
                >
                  <div
                    className="w-full bg-gradient-to-t from-primary to-primary-400 rounded-t cursor-pointer hover:shadow-lg transition-all group-hover:from-primary-600 group-hover:to-primary"
                    style={{
                      height: `${(d.score / 100) * 160}px`,
                      minHeight: '4px',
                    }}
                  />
                  {idx % Math.ceil(trajectoryData.length / 5) === 0 && (
                    <span className="text-xs text-muted-foreground mt-1 w-full text-center">
                      {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              ))}
          </div>
        </ChartCard>
      </div>

      {/* Insights and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-success-200/50 dark:border-success-700/50 bg-success-50/30 dark:bg-success-900/20 p-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-success-100 dark:bg-success-800 flex items-center justify-center text-lg">
              🎯
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Strong Areas</h4>
              <p className="text-sm text-muted-foreground">
                {heatmapData.filter((d: any) => d.mastery >= 80).map((d: any) => d.topic).join(', ') || 'No strong areas yet'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-warning-200/50 dark:border-warning-700/50 bg-warning-50/30 dark:bg-warning-900/20 p-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning-100 dark:bg-warning-800 flex items-center justify-center text-lg">
              ⚡
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Focus Areas</h4>
              <p className="text-sm text-muted-foreground">
                {heatmapData.filter((d: any) => d.mastery < 60).map((d: any) => d.topic).slice(0, 2).join(', ') || 'All mastered!'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-primary-200/50 dark:border-primary-700/50 bg-primary-50/30 dark:bg-primary-900/20 p-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-lg">
              📈
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Progress This Week</h4>
              <p className="text-sm text-muted-foreground">
                +{Math.floor(Math.random() * 15)}% improvement in consistency
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
