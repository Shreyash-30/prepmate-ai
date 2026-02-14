/**
 * Dashboard Page - Premium SaaS Design
 * Main overview showing readiness, tasks, weak topics, and activity
 */

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { dashboardService } from '@/services/dashboardService';
import { TrendingUp, CheckCircle2, Clock, Zap, BookOpen } from 'lucide-react';
import { SectionHeader, MetricCard, GradientCard, ProgressIndicator } from '@/components/ui/design-system';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: readiness } = useQuery({
    queryKey: ['readiness'],
    queryFn: dashboardService.getReadiness,
  });
  const { data: tasks } = useQuery({
    queryKey: ['todayTasks'],
    queryFn: dashboardService.getTodayTasks,
  });

  const readinessData = readiness?.data;
  const tasksData = tasks?.data || [];
  const completedTasks = tasksData.filter((t: any) => t.completed).length;
  const totalTasks = tasksData.length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Hero Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-base text-muted-foreground">
          Here's your interview preparation overview
        </p>
      </div>

      {/* Readiness Hero Card */}
      <GradientCard className="overflow-hidden">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Overall Readiness</h2>
            <p className="text-sm text-muted-foreground">Your current interview preparation level</p>
          </div>
          <div className="text-4xl">📊</div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-6xl font-bold text-primary mb-2">
              {readinessData?.overall || 0}%
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="text-success font-semibold">↗ +3%</span> from last week
            </p>
          </div>
          <div className="flex flex-col justify-center items-end gap-4">
            <ProgressIndicator
              value={readinessData?.overall || 0}
              label="Overall Progress"
              color="primary"
              size="lg"
            />
          </div>
        </div>
      </GradientCard>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Consistency Streak"
          value="12"
          subtitle="days in a row"
          icon="🔥"
          trend={3}
          gradient
        />
        <MetricCard
          title="Today's Tasks"
          value={`${completedTasks}/${totalTasks}`}
          subtitle="tasks completed"
          icon="✅"
          trend={0}
        />
        <MetricCard
          title="Study Time"
          value="2.5h"
          subtitle="this week"
          icon="⏱️"
          trend={12}
        />
        <MetricCard
          title="Topics Mastered"
          value="4"
          subtitle="of 12 topics"
          icon="🎯"
          trend={25}
          gradient
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-border/50 bg-card overflow-hidden hover:shadow-card-hover transition-all duration-300">
            <div className="border-b border-border/30 px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Today's Tasks
              </h2>
            </div>
            <div className="p-6">
              {tasksData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📝</div>
                  <p className="text-muted-foreground">No tasks scheduled for today</p>
                  <p className="text-sm text-muted-foreground mt-2">Add tasks in Planning to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasksData.map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 rounded-lg border border-border/30 p-4 hover:bg-secondary/50 transition-all duration-200 group"
                    >
                      <input
                        type="checkbox"
                        defaultChecked={task.completed}
                        className="h-5 w-5 rounded border-border cursor-pointer accent-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.topic} · {task.estimated_minutes} min
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap bg-primary-50 dark:bg-primary-900/30 text-primary dark:text-primary-400 border border-primary-200/50 dark:border-primary-700/50">
                        {task.difficulty}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Sidebar */}
        <div className="space-y-4">
          {/* Active Topics */}
          <div className="rounded-lg border border-border/50 bg-card p-6 hover:shadow-card-hover transition-all">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Topics This Week
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Arrays & Sorting', progress: 85 },
                { name: 'Trees & Graphs', progress: 62 },
                { name: 'Dynamic Prog.', progress: 45 },
              ].map((topic) => (
                <div key={topic.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{topic.name}</span>
                    <span className="text-xs text-muted-foreground">{topic.progress}%</span>
                  </div>
                  <ProgressIndicator value={topic.progress} size="sm" color="primary" />
                </div>
              ))}
            </div>
          </div>

          {/* Last Activity */}
          <div className="rounded-lg border border-border/50 bg-card p-6 hover:shadow-card-hover transition-all">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Recent Activity
            </h3>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                <span className="text-primary font-medium">Completed</span> 5 DSA problems
              </p>
              <p className="text-muted-foreground">
                <span className="text-success font-medium">Mastered</span> Binary Search
              </p>
              <p className="text-muted-foreground">
                <span className="text-warning font-medium">Improving</span> on Tree problems
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
