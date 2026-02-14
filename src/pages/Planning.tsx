import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { CalendarDays, Sliders, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function Planning() {
  const { data: tasks } = useQuery({ queryKey: ['planningTasks'], queryFn: api.planning.getTasks });
  const [workload, setWorkload] = useState(3);

  // Group by date
  const grouped = tasks?.reduce((acc, t) => {
    const d = t.due_date.split('T')[0];
    if (!acc[d]) acc[d] = [];
    acc[d].push(t);
    return acc;
  }, {} as Record<string, typeof tasks>) || {};

  const dayLabels = ['Today', 'Tomorrow'];

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" /> Adaptive Planning
        </h1>
        <p className="text-sm text-muted-foreground mt-1">AI-optimized daily preparation schedule</p>
      </div>

      {/* Workload Slider */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Sliders className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-card-foreground">Daily Workload</span>
          <span className="ml-auto text-sm font-bold text-primary">{workload} hours</span>
        </div>
        <input
          type="range"
          min={1}
          max={8}
          value={workload}
          onChange={(e) => setWorkload(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Light (1h)</span>
          <span>Intense (8h)</span>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([date, dayTasks], i) => (
          <div key={date} className="animate-fade-in">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              {i < 2 ? dayLabels[i] : new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h3>
            <div className="space-y-2">
              {dayTasks?.map((task) => (
                <div key={task.id} className={cn('flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:shadow-sm cursor-pointer', task.completed && 'opacity-60')}>
                  <div className={cn('h-2 w-2 rounded-full shrink-0', task.type === 'practice' ? 'bg-primary' : 'bg-mastery-improving')} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium text-card-foreground', task.completed && 'line-through')}>{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.estimated_minutes} min · {task.difficulty}</p>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', task.type === 'practice' ? 'bg-primary/10 text-primary' : 'bg-mastery-improving/10 text-mastery-improving')}>
                    {task.type}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
