import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import { Map, ChevronRight, BookOpen, CheckCircle2, Circle } from 'lucide-react';

const categories = ['DSA', 'OS', 'DBMS', 'CN', 'OOPs'];

const masteryColors = {
  strong: 'bg-mastery-strong/10 text-mastery-strong border-mastery-strong/20',
  improving: 'bg-mastery-improving/10 text-mastery-improving border-mastery-improving/20',
  weak: 'bg-mastery-weak/10 text-mastery-weak border-mastery-weak/20',
  not_started: 'bg-muted text-muted-foreground border-border',
};

export default function Roadmap() {
  const [active, setActive] = useState('DSA');
  const { data: topics, isLoading } = useQuery({
    queryKey: ['roadmap', active],
    queryFn: () => api.roadmap.getTopics(active),
  });

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Map className="h-6 w-6 text-primary" /> Roadmap & Progress
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Track your mastery across all subjects</p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
              active === cat ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-card-foreground hover:bg-muted'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
                <div className="h-4 bg-muted rounded w-2/3 mb-3" />
                <div className="h-2 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))
          : topics?.map((topic) => (
              <div key={topic.id} className="rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-shadow animate-fade-in group cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-card-foreground">{topic.name}</h3>
                  <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', masteryColors[topic.mastery])}>
                    {topic.mastery === 'not_started' ? 'Not started' : topic.mastery}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted mb-3">
                  <div
                    className={cn('h-full rounded-full transition-all', topic.mastery === 'strong' ? 'bg-mastery-strong' : topic.mastery === 'improving' ? 'bg-mastery-improving' : topic.mastery === 'weak' ? 'bg-mastery-weak' : 'bg-muted-foreground/20')}
                    style={{ width: `${(topic.problems_solved / topic.total_problems) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{topic.problems_solved}/{topic.total_problems} problems</span>
                  <span className="flex items-center gap-1">
                    Confidence: {topic.confidence}%
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-primary flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> Study topic
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
