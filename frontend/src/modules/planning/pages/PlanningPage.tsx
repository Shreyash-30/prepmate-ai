/**
 * Planning Page - Premium SaaS Design
 * Weekly planning and task management
 */

import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import { SectionHeader } from '@/components/ui/design-system';
import { CalendarDays, Plus, CheckCircle2, Clock } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function PlanningPage() {
  const [selectedDay, setSelectedDay] = useState(0);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const { data: tasksQuery } = useQuery({
    queryKey: ['weeklyTasks'],
    queryFn: () => dashboardService.getTodayTasks(),
  });

  const tasks = tasksQuery?.data || [];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return { bg: 'bg-success-50 dark:bg-success-900/30', badge: 'bg-success-100 dark:bg-success-900/50 text-success dark:text-success-400', border: 'border-success-200 dark:border-success-700/50' };
      case 'medium':
        return { bg: 'bg-warning-50 dark:bg-warning-900/30', badge: 'bg-warning-100 dark:bg-warning-900/50 text-warning dark:text-warning-400', border: 'border-warning-200 dark:border-warning-700/50' };
      case 'hard':
        return { bg: 'bg-destructive/5 dark:bg-destructive/20', badge: 'bg-destructive/10 dark:bg-destructive/30 text-destructive dark:text-destructive-400', border: 'border-destructive/20 dark:border-destructive/40' };
      default:
        return { bg: 'bg-secondary/50 dark:bg-secondary/30', badge: 'bg-primary-100 dark:bg-primary-900/50 text-primary dark:text-primary-400', border: 'border-border/50' };
    }
  };

  const tasksForDay = tasks.slice(0, 5); // Simulating daily tasks
  const completedCount = tasksForDay.filter((t: any) => t.completed).length;

  return (
    <div className="space-y-6 lg:space-y-8">
      <SectionHeader
        title="Weekly Planning"
        subtitle="Organize your interview prep with smart scheduling"
        action={
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{tasksForDay.length}</p>
            <p className="text-xs text-muted-foreground">Tasks This Week</p>
          </div>
        }
      />

      {/* Day Selector */}
      <div className="rounded-lg border border-border/50 bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Select Day</h3>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => (
            <button
              key={day}
              onClick={() => setSelectedDay(idx)}
              className={cn(
                'aspect-square rounded-lg flex flex-col items-center justify-center font-medium text-sm transition-all',
                'border border-border/50',
                selectedDay === idx
                  ? 'bg-gradient-to-br from-primary to-primary-600 text-primary-foreground shadow-md'
                  : 'bg-secondary/50 hover:bg-secondary text-foreground'
              )}
            >
              <span className="text-xs text-center">{day.slice(0, 3)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Daily Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-success-200 dark:border-success-700/50 bg-success-50/50 dark:bg-success-900/20 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-success">{completedCount}/{tasksForDay.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-primary-200 dark:border-primary-700/50 bg-primary-50/50 dark:bg-primary-900/20 p-6">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total Time</p>
              <p className="text-2xl font-bold text-primary">
                {tasksForDay.reduce((sum: number, t: any) => sum + (t.estimated_minutes || 0), 0)}m
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-primary-200 dark:border-primary-700/50 bg-primary-50/50 dark:bg-primary-900/20 p-6">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="text-2xl font-bold text-primary">{Math.round((completedCount / tasksForDay.length) * 100)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks for Selected Day */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">{days[selectedDay]}'s Tasks</h3>
          <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:shadow-lg text-sm font-medium transition-all">
            <Plus className="h-4 w-4" /> Add Task
          </button>
        </div>

        {tasksForDay.length > 0 ? (
          <div className="space-y-3">
            {tasksForDay.map((task: any) => {
              const colors = getDifficultyColor(task.difficulty);
              return (
                <div
                  key={task.id}
                  className={cn(
                    'rounded-lg border transition-all hover:shadow-card-hover group',
                    colors.border,
                    'p-4 bg-card hover:bg-gradient-to-br hover:from-card hover:to-secondary/30'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      defaultChecked={task.completed}
                      className={cn(
                        'mt-1 h-5 w-5 rounded-md cursor-pointer accent-primary',
                        task.completed && 'line-through'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-semibold text-foreground group-hover:text-primary transition-colors',
                        task.completed && 'line-through opacity-60'
                      )}>
                        {task.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="inline-flex items-center gap-1">
                          📚 {task.topic}
                        </span>
                        <span className="inline-flex items-center gap-1 ml-3">
                          ⏱️ {task.estimated_minutes}m
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end gap-y-2">
                      <span className={cn(
                        'inline-block rounded-full px-3 py-1 text-xs font-bold border',
                        colors.badge,
                        'border-current/20'
                      )}>
                        {task.difficulty}
                      </span>
                      {task.completed && (
                        <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-border/50 bg-gradient-to-br from-secondary to-secondary/50 p-12 text-center">
            <div className="text-4xl mb-3">✨</div>
            <h4 className="font-semibold text-foreground mb-1">No tasks yet</h4>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Plan your week by adding tasks. Start small and build momentum.
            </p>
          </div>
        )}
      </div>

      {/* Weekly Summary */}
      <div className="rounded-lg border border-border/50 bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {days.map((day, idx) => (
            <div key={day} className="rounded-lg border border-border/30 bg-secondary/50 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">{day}</p>
              <div className="flex items-center justify-center gap-1">
                <span className="text-lg font-bold text-primary">3</span>
                <span className="text-xs text-muted-foreground">tasks</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">180m total</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
