/**
 * Practice Page - Premium SaaS Design
 * AI-assisted coding practice lab
 */

import { useQuery } from '@tanstack/react-query';
import { practiceService } from '@/services/practiceService';
import { SectionHeader, MetricCard } from '@/components/ui/design-system';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Code2, Play, Lightbulb, Send, Zap, Target, Award } from 'lucide-react';
import { useState } from 'react';

export default function PracticePage() {
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);
  const [code, setCode] = useState('// Solution goes here\nfunction solve(input) {\n  \n}');

  const { data: problemsQuery } = useQuery({
    queryKey: ['problems'],
    queryFn: () => practiceService.getProblems(),
  });

  const problems = problemsQuery?.data || [];
  
  const difficultyConfig = {
    easy: { bg: 'bg-success-50 dark:bg-success-900/30', text: 'text-success dark:text-success-400', border: 'border-success-200 dark:border-success-700/50', icon: '🟢', label: 'Easy' },
    medium: { bg: 'bg-warning-50 dark:bg-warning-900/30', text: 'text-warning dark:text-warning-400', border: 'border-warning-200 dark:border-warning-700/50', icon: '🟡', label: 'Medium' },
    hard: { bg: 'bg-destructive/5 dark:bg-destructive/20', text: 'text-destructive dark:text-destructive-400', border: 'border-destructive/20 dark:border-destructive/40', icon: '🔴', label: 'Hard' },
  };

  const selectedProblemData = problems.find((p: any) => p.id === selectedProblem);
  const easyCount = problems.filter((p: any) => p.difficulty === 'easy').length;
  const mediumCount = problems.filter((p: any) => p.difficulty === 'medium').length;
  const hardCount = problems.filter((p: any) => p.difficulty === 'hard').length;

  return (
    <div className="space-y-6 lg:space-y-8">
      <SectionHeader
        title="Practice Lab"
        subtitle="Master problem-solving with guided AI assistance"
        action={
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{problems.length}</p>
            <p className="text-xs text-muted-foreground">Problems Available</p>
          </div>
        }
      />

      {/* Problem Stats */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          title="Easy"
          value={easyCount.toString()}
          subtitle="problems"
          icon="🟢"
          className="bg-success-50/50 dark:bg-success-900/20"
        />
        <MetricCard
          title="Medium"
          value={mediumCount.toString()}
          subtitle="problems"
          icon="🟡"
          className="bg-warning-50/50 dark:bg-warning-900/20"
        />
        <MetricCard
          title="Hard"
          value={hardCount.toString()}
          subtitle="problems"
          icon="🔴"
          className="bg-destructive/5 dark:bg-destructive/10"
        />
      </div>

      {/* Main Practice Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Problem List Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-border/50 bg-card overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-border/30 bg-gradient-to-r from-primary-50 to-primary/5 dark:from-primary-900/20 dark:to-primary-900/10">
              <h3 className="font-semibold text-foreground mb-3">Problem List</h3>
              <input
                type="text"
                placeholder="Search problems..."
                className="w-full rounded-lg border border-primary-200 dark:border-primary-700/50 bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border/30">
              {problems.length > 0 ? problems.map((p: any) => {
                const difficulty = difficultyConfig[p.difficulty as keyof typeof difficultyConfig];
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProblem(p.id)}
                    className={cn(
                      'w-full text-left px-4 py-3 transition-all duration-200',
                      selectedProblem === p.id
                        ? 'bg-primary-50 dark:bg-primary-900/30 border-l-2 border-l-primary'
                        : 'hover:bg-secondary/50 dark:hover:bg-secondary/30'
                    )}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <p className="font-medium text-sm text-foreground flex-1 line-clamp-2">{p.title}</p>
                      <span className="text-xs font-bold text-muted-foreground flex-shrink-0">{p.id}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{p.topic}</p>
                    <span className={cn(
                      'inline-block px-2 py-1 rounded text-xs font-medium',
                      difficulty.bg,
                      difficulty.text,
                      difficulty.border,
                      'border'
                    )}>
                      {difficulty.icon} {difficulty.label}
                    </span>
                  </button>
                );
              }) : (
                <div className="p-4 text-center text-muted-foreground">
                  <p className="text-sm">No problems available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Code Editor Area */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {selectedProblemData ? (
            <>
              {/* Problem Details Header */}
              <div className="rounded-lg border border-border/50 bg-gradient-to-br from-card to-secondary/30 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-1">{selectedProblemData.title}</h2>
                    <p className="text-sm text-muted-foreground">Solve this coding challenge to strengthen your skills</p>
                  </div>
                  <div className={cn(
                    'inline-flex items-center justify-center h-12 w-12 rounded-lg font-bold text-lg',
                    difficultyConfig[selectedProblemData.difficulty as keyof typeof difficultyConfig].bg,
                    difficultyConfig[selectedProblemData.difficulty as keyof typeof difficultyConfig].text,
                    difficultyConfig[selectedProblemData.difficulty as keyof typeof difficultyConfig].border,
                    'border'
                  )}>
                    {difficultyConfig[selectedProblemData.difficulty as keyof typeof difficultyConfig].icon}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Difficulty</p>
                      <p className="font-semibold text-foreground capitalize">{selectedProblemData.difficulty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Time Limit</p>
                      <p className="font-semibold text-foreground">45m</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="font-semibold text-foreground">{selectedProblemData.topic}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editor */}
              <div className="rounded-lg border border-border/50 bg-card overflow-hidden flex flex-col flex-1">
                <div className="flex items-center justify-between p-4 border-b border-border/30 bg-gradient-to-r from-secondary to-secondary/50">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Solution</h3>
                  </div>
                  <div className="flex gap-2">
                    <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-foreground text-sm font-medium transition-colors border border-border/30">
                      <Lightbulb className="h-4 w-4" /> Hint
                    </button>
                    <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-foreground text-sm font-medium transition-colors border border-border/30">
                      <Play className="h-4 w-4" /> Run
                    </button>
                    <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary to-primary-600 hover:shadow-md text-primary-foreground text-sm font-medium transition-all">
                      <Send className="h-4 w-4" /> Submit
                    </button>
                  </div>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 w-full font-mono text-sm p-4 bg-background border-none focus:outline-none resize-none dark:bg-slate-950 text-foreground"
                  placeholder="Write your solution here..."
                />
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-border/50 bg-gradient-to-br from-secondary to-secondary/50 p-12 text-center flex-1 flex flex-col items-center justify-center">
              <div className="text-5xl mb-4">💻</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Select a Problem</h3>
              <p className="text-muted-foreground max-w-sm">
                Choose a problem from the list to start coding. Our AI will guide you with hints and feedback.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
