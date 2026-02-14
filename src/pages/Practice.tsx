import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import { Code2, Play, Lightbulb, ChevronRight, CheckCircle2, Circle, Sparkles, Send } from 'lucide-react';

export default function Practice() {
  const { data: problems } = useQuery({ queryKey: ['problems'], queryFn: () => api.practice.getProblems() });
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);
  const [code, setCode] = useState('// Write your solution here\nfunction solution(input) {\n  \n}');

  const difficultyColors = {
    easy: 'text-mastery-strong bg-mastery-strong/10',
    medium: 'text-mastery-improving bg-mastery-improving/10',
    hard: 'text-mastery-weak bg-mastery-weak/10',
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Code2 className="h-6 w-6 text-primary" /> Practice Lab
        </h1>
        <p className="text-sm text-muted-foreground mt-1">AI-assisted coding practice</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
        {/* Problem List */}
        <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <input
              type="text"
              placeholder="Search problems..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {problems?.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProblem(p.id)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border/50',
                  selectedProblem === p.id ? 'bg-accent' : 'hover:bg-muted/50'
                )}
              >
                {p.solved ? (
                  <CheckCircle2 className="h-4 w-4 text-mastery-strong shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.topic} · {p.platform}</p>
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', difficultyColors[p.difficulty])}>
                  {p.difficulty}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Code Editor */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="text-sm font-medium text-card-foreground">Code Editor</span>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 rounded-md bg-mastery-improving/10 px-3 py-1.5 text-xs font-medium text-mastery-improving transition-colors hover:bg-mastery-improving/20">
                  <Lightbulb className="h-3.5 w-3.5" /> Hint
                </button>
                <button className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:opacity-90">
                  <Play className="h-3.5 w-3.5" /> Run
                </button>
                <button className="flex items-center gap-1.5 rounded-md bg-mastery-strong px-3 py-1.5 text-xs font-medium text-mastery-strong-foreground transition-colors hover:opacity-90">
                  <Send className="h-3.5 w-3.5" /> Submit
                </button>
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 w-full resize-none bg-card p-4 font-mono text-sm text-card-foreground focus:outline-none scrollbar-thin"
              spellCheck={false}
            />
          </div>

          {/* Test Cases & AI Review */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Test Cases</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-mastery-strong" />
                  <span className="text-card-foreground">Test 1: [1,2,3] → 6</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                  <span className="text-card-foreground">Test 2: [5,5] → 10</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                  <span className="text-card-foreground">Test 3: [-1,1] → 0</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> AI Review
              </h3>
              <p className="text-sm text-muted-foreground">Submit your solution to get AI-powered code review and optimization suggestions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
