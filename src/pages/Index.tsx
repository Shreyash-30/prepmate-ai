import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import {
  Target, TrendingUp, AlertTriangle, CheckCircle2, Clock, Flame,
  ArrowUpRight, BookOpen, Brain, BarChart3
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', color || 'bg-accent')}>
          <Icon className="h-4 w-4 text-accent-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold text-card-foreground">{value}</p>
        </div>
      </div>
      {sub && <p className="mt-2 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function MasteryBadge({ level }: { level: string }) {
  const styles = {
    strong: 'bg-mastery-strong/10 text-mastery-strong',
    improving: 'bg-mastery-improving/10 text-mastery-improving',
    weak: 'bg-mastery-weak/10 text-mastery-weak',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', styles[level as keyof typeof styles] || 'bg-muted text-muted-foreground')}>
      {level}
    </span>
  );
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: readiness } = useQuery({ queryKey: ['readiness'], queryFn: api.dashboard.getReadiness });
  const { data: tasks } = useQuery({ queryKey: ['todayTasks'], queryFn: api.dashboard.getTodayTasks });
  const { data: weakTopics } = useQuery({ queryKey: ['weakTopics'], queryFn: api.dashboard.getWeakTopics });
  const { data: activity } = useQuery({ queryKey: ['activity'], queryFn: api.dashboard.getActivity });

  const completedTasks = tasks?.filter((t) => t.completed).length || 0;
  const totalTasks = tasks?.length || 0;

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's your preparation overview for today</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Target} label="Readiness Score" value={`${readiness?.overall || 0}%`} sub="+3% from last week" color="bg-primary/10" />
        <StatCard icon={Flame} label="Consistency Streak" value="12 days" sub="Keep it up!" color="bg-mastery-improving/10" />
        <StatCard icon={CheckCircle2} label="Today's Progress" value={`${completedTasks}/${totalTasks}`} sub="tasks completed" color="bg-mastery-strong/10" />
        <StatCard icon={TrendingUp} label="Improvement Velocity" value="+8.5%" sub="weekly growth rate" color="bg-accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tasks & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks */}
          <div className="rounded-xl border border-border bg-card p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" /> Today's Tasks
              </h2>
              <span className="text-xs text-muted-foreground">{completedTasks} of {totalTasks} done</span>
            </div>
            <div className="space-y-2">
              {tasks?.map((task) => (
                <div key={task.id} className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors', task.completed ? 'bg-muted/50' : 'hover:bg-muted/30')}>
                  <div className={cn('h-2 w-2 rounded-full shrink-0', task.completed ? 'bg-mastery-strong' : task.difficulty === 'hard' ? 'bg-mastery-weak' : task.difficulty === 'medium' ? 'bg-mastery-improving' : 'bg-mastery-strong')} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm text-card-foreground', task.completed && 'line-through opacity-60')}>{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.topic} · {task.estimated_minutes}min</p>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', task.type === 'practice' ? 'bg-primary/10 text-primary' : task.type === 'revision' ? 'bg-mastery-improving/10 text-mastery-improving' : task.type === 'mock' ? 'bg-chart-5/10 text-chart-5' : 'bg-accent text-accent-foreground')}>
                    {task.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Improvement Chart */}
          <div className="rounded-xl border border-border bg-card p-5 animate-fade-in">
            <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-muted-foreground" /> Preparation Activity (30 days)
            </h2>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activity || []}>
                  <defs>
                    <linearGradient id="colorProblems" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(172, 66%, 36%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(172, 66%, 36%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => new Date(v).getDate().toString()} stroke="hsl(215, 15%, 48%)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(215, 15%, 48%)" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(214, 20%, 90%)' }} />
                  <Area type="monotone" dataKey="problems_solved" stroke="hsl(172, 66%, 36%)" fillOpacity={1} fill="url(#colorProblems)" strokeWidth={2} name="Problems Solved" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Readiness Breakdown */}
          <div className="rounded-xl border border-border bg-card p-5 animate-fade-in">
            <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2 mb-4">
              <Brain className="h-4 w-4 text-muted-foreground" /> Readiness Breakdown
            </h2>
            <div className="space-y-3">
              {readiness && Object.entries(readiness).filter(([k]) => k !== 'overall').map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-card-foreground font-medium uppercase">{key}</span>
                    <span className="text-muted-foreground">{val}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full transition-all', val >= 75 ? 'bg-mastery-strong' : val >= 50 ? 'bg-mastery-improving' : 'bg-mastery-weak')}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weak Topics */}
          <div className="rounded-xl border border-border bg-card p-5 animate-fade-in">
            <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-mastery-weak" /> Weak Areas
            </h2>
            <div className="space-y-2">
              {weakTopics?.map((topic) => (
                <div key={topic} className="flex items-center justify-between rounded-lg bg-mastery-weak/5 px-3 py-2">
                  <span className="text-sm text-card-foreground">{topic}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-mastery-weak" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-border bg-card p-5 animate-fade-in">
            <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4 text-muted-foreground" /> Quick Actions
            </h2>
            <div className="space-y-2">
              <button className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90">
                Start Practice Session
              </button>
              <button className="w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-muted">
                Take Mock Interview
              </button>
              <button className="w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-muted">
                Review Weak Topics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
