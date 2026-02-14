import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { BarChart3, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

function HeatmapCell({ value }: { value: number }) {
  const bg = value >= 75 ? 'bg-mastery-strong' : value >= 50 ? 'bg-mastery-improving' : value >= 25 ? 'bg-mastery-weak' : 'bg-muted';
  return <div className={cn('h-8 w-full rounded-md', bg)} style={{ opacity: 0.3 + (value / 100) * 0.7 }} />;
}

export default function Analytics() {
  const { data: heatmap } = useQuery({ queryKey: ['heatmap'], queryFn: api.analytics.getHeatmapData });
  const { data: trajectory } = useQuery({ queryKey: ['trajectory'], queryFn: api.analytics.getTrajectory });

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> Analytics & Intelligence
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Deep insights into your preparation progress</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Readiness Trajectory */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-muted-foreground" /> Readiness Trajectory
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trajectory || []}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(172, 66%, 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(172, 66%, 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => new Date(v).getDate().toString()} stroke="hsl(215, 15%, 48%)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(215, 15%, 48%)" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(214, 20%, 90%)' }} />
                <Area type="monotone" dataKey="score" stroke="hsl(172, 66%, 36%)" fill="url(#colorScore)" strokeWidth={2} name="Readiness" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Topic Mastery Heatmap */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground mb-4">Topic Mastery Heatmap</h2>
          <div className="space-y-3">
            {heatmap?.map((item) => (
              <div key={item.topic} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24 text-right shrink-0">{item.topic}</span>
                <div className="flex-1">
                  <div className="h-6 rounded-md bg-muted overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-md transition-all',
                        item.mastery >= 75 ? 'bg-mastery-strong' : item.mastery >= 50 ? 'bg-mastery-improving' : 'bg-mastery-weak'
                      )}
                      style={{ width: `${item.mastery}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-card-foreground w-10">{item.mastery}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Impact Metrics */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground mb-4">Preparation Impact</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Topics Mastered', value: '18/50', sub: '+3 this week' },
              { label: 'Problems Solved', value: '247', sub: '+28 this week' },
              { label: 'Avg. Solve Time', value: '24 min', sub: '-3 min improvement' },
              { label: 'Retention Rate', value: '82%', sub: 'Above average' },
            ].map((m) => (
              <div key={m.label} className="rounded-lg bg-muted/50 p-3">
                <p className="text-lg font-bold text-card-foreground">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-xs text-primary mt-1">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Retention */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground mb-4">Retention Indicators</h2>
          <div className="space-y-4">
            {[
              { topic: 'Arrays & Hashing', retention: 92, trend: 'stable' },
              { topic: 'Dynamic Programming', retention: 58, trend: 'declining' },
              { topic: 'Graphs', retention: 71, trend: 'improving' },
              { topic: 'Trees', retention: 85, trend: 'stable' },
              { topic: 'Binary Search', retention: 78, trend: 'improving' },
            ].map((r) => (
              <div key={r.topic} className="flex items-center gap-3">
                <span className="text-sm text-card-foreground w-40 shrink-0">{r.topic}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full', r.retention >= 80 ? 'bg-mastery-strong' : r.retention >= 60 ? 'bg-mastery-improving' : 'bg-mastery-weak')}
                    style={{ width: `${r.retention}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-16">{r.retention}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
