/**
 * Mock Interview Page - Premium SaaS Design
 * Simulate real technical interviews with timed sessions
 */

import { useState } from 'react';
import { SectionHeader, MetricCard } from '@/components/ui/design-system';
import { Swords, Play, Clock, TrendingUp, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MockInterviewPage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const difficulties = [
    { id: 'easy', label: 'Easy', icon: '🟢', duration: '30 mins', sessions: 12 },
    { id: 'medium', label: 'Medium', icon: '🟡', duration: '45 mins', sessions: 24 },
    { id: 'hard', label: 'Hard', icon: '🔴', duration: '60 mins', sessions: 18 },
  ];

  const sessions = [
    { id: 1, number: 1, difficulty: 'easy', topics: 'Arrays & Strings', date: '3 days ago', score: 85, completed: true },
    { id: 2, number: 2, difficulty: 'medium', topics: 'Trees & Graphs', date: '5 days ago', score: 72, completed: true },
    { id: 3, number: 3, difficulty: 'hard', topics: 'DP & Advanced Algorithms', date: 'Not started', score: null, completed: false },
    { id: 4, number: 4, difficulty: 'medium', topics: 'System Design Basics', date: 'Today', score: null, completed: false },
  ];

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return { bg: 'bg-success-50 dark:bg-success-900/30', badge: 'bg-success-100 dark:bg-success-900/50 text-success dark:text-success-400', border: 'border-success-200 dark:border-success-700/50', icon: '🟢' };
      case 'medium':
        return { bg: 'bg-warning-50 dark:bg-warning-900/30', badge: 'bg-warning-100 dark:bg-warning-900/50 text-warning dark:text-warning-400', border: 'border-warning-200 dark:border-warning-700/50', icon: '🟡' };
      case 'hard':
        return { bg: 'bg-destructive/5 dark:bg-destructive/20', badge: 'bg-destructive/10 dark:bg-destructive/30 text-destructive dark:text-destructive-400', border: 'border-destructive/20 dark:border-destructive/40', icon: '🔴' };
      default:
        return { bg: 'bg-secondary/50', badge: 'bg-primary-100 dark:bg-primary-900/50 text-primary dark:text-primary-400', border: 'border-border/50', icon: '⚪' };
    }
  };

  const avgScore = 78;
  const sessionsCompleted = sessions.filter(s => s.completed).length;

  return (
    <div className="space-y-6 lg:space-y-8">
      <SectionHeader
        title="Mock Interviews"
        subtitle="Practice real interview scenarios with AI evaluation and feedback"
        action={
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{sessionsCompleted}/{sessions.length}</p>
            <p className="text-xs text-muted-foreground">Sessions Completed</p>
          </div>
        }
      />

      {/* Hero Section */}
      <div className="rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-900 dark:to-primary-950 text-white p-8 md:p-12 border border-primary-400/50">
        <div className="flex items-center justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold mb-2">Start Your Next Interview</h2>
            <p className="text-primary-100 mb-6">Get real-time feedback from our AI on your coding, communication, and problem-solving approach</p>
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-primary font-semibold hover:shadow-lg transition-all">
              <Play className="h-5 w-5" /> Start Interview Now
            </button>
          </div>
          <div className="hidden lg:flex h-24 w-24 rounded-full bg-white/20 items-center justify-center text-5xl">
            🎤
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Avg Score"
          value={avgScore.toString()}
          subtitle="percent"
          icon="📊"
          className="bg-primary-50/50 dark:bg-primary-900/20"
        />
        <MetricCard
          title="Sessions Done"
          value={sessionsCompleted.toString()}
          subtitle="completed"
          icon="✅"
          className="bg-success-50/50 dark:bg-success-900/20"
        />
        <MetricCard
          title="Total Duration"
          value="180"
          subtitle="minutes"
          icon="⏱️"
          className="bg-primary-50/50 dark:bg-primary-900/20"
        />
        <MetricCard
          title="Improvement"
          value="↑ 12"
          subtitle="percent"
          icon="📈"
          trend={3}
          className="bg-success-50/50 dark:bg-success-900/20"
        />
      </div>

      {/* Difficulty Selector */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Choose Difficulty Level</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {difficulties.map((diff) => {
            const isSelected = selectedDifficulty === diff.id;
            const config = getDifficultyConfig(diff.id);
            return (
              <button
                key={diff.id}
                onClick={() => setSelectedDifficulty(diff.id as any)}
                className={cn(
                  'rounded-lg p-4 text-center transition-all duration-200',
                  'border-2',
                  isSelected
                    ? `${config.bg} ${config.border} shadow-card-hover`
                    : 'border-border/50 bg-card hover:bg-secondary/50'
                )}
              >
                <p className="text-2xl mb-2">{diff.icon}</p>
                <h4 className="font-semibold text-foreground mb-1">{diff.label}</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  <Clock className="inline h-3 w-3 mr-1" />
                  {diff.duration}
                </p>
                <span className="text-xs font-medium text-muted-foreground">{diff.sessions} sessions</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interview Sessions */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Your Interview Sessions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((session) => {
            const config = getDifficultyConfig(session.difficulty);
            return (
              <div
                key={session.id}
                className={cn(
                  'rounded-lg border transition-all hover:shadow-card-hover group',
                  config.border,
                  'p-6 bg-card hover:bg-gradient-to-br hover:from-card hover:to-secondary/30'
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                      Session {session.number}
                    </h4>
                    <p className="text-sm text-muted-foreground">{session.topics}</p>
                  </div>
                  <span className={cn(
                    'inline-block rounded-full px-2 py-1 text-xs font-bold border',
                    config.badge,
                    'border-current/20'
                  )}>
                    {config.icon} {session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-t border-border/30">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Date</p>
                    <p className="text-sm font-medium text-foreground">{session.date}</p>
                  </div>
                  {session.completed ? (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Score</p>
                        <p className="text-lg font-bold text-success">{session.score}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Feedback</p>
                        <button className="text-xs font-semibold text-primary hover:underline">
                          View Report →
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-2">
                        <button className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary to-primary-600 text-primary-foreground font-medium text-sm hover:shadow-lg transition-all">
                          <Play className="h-4 w-4" /> Start
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {session.completed && (
                  <div className="flex items-center gap-2 text-xs text-success">
                    <Trophy className="h-3.5 w-3.5" /> Completed successfully
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tips Section */}
      <div className="rounded-lg border border-primary-200/50 dark:border-primary-700/50 bg-primary-50/50 dark:bg-primary-900/20 p-6">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="text-lg">💡</span> Interview Tips
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-foreground">
          <li className="flex gap-2">
            <span>✓</span>
            <span>Think out loud - explain your approach clearly</span>
          </li>
          <li className="flex gap-2">
            <span>✓</span>
            <span>Ask clarifying questions before coding</span>
          </li>
          <li className="flex gap-2">
            <span>✓</span>
            <span>Test your code with multiple examples</span>
          </li>
          <li className="flex gap-2">
            <span>✓</span>
            <span>Discuss time and space complexity</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
