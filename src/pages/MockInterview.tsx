import { useState } from 'react';
import { Swords, Clock, Maximize, Play, MessageSquare, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MockInterview() {
  const [phase, setPhase] = useState<'setup' | 'coding' | 'feedback'>('setup');
  const [timer, setTimer] = useState(45);

  if (phase === 'feedback') {
    return (
      <div className="min-h-screen p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <CheckCircle2 className="h-12 w-12 text-mastery-strong mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground">Interview Complete</h1>
            <p className="text-muted-foreground mt-1">Here's your performance summary</p>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Problem Solving', score: 78 },
              { label: 'Code Quality', score: 85 },
              { label: 'Communication', score: 70 },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-2xl font-bold text-card-foreground">{m.score}%</p>
                <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-3">Feedback</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Good approach to breaking down the problem. Consider discussing time/space complexity upfront. Your BFS implementation was correct but could be optimized with early termination. Practice explaining your thought process while coding.
            </p>
          </div>
          <button onClick={() => setPhase('setup')} className="mt-6 w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            Start New Interview
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'coding') {
    return (
      <div className="min-h-screen p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-foreground">Mock Interview — In Progress</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-mastery-weak">
              <Clock className="h-4 w-4" /> {timer}:00 remaining
            </div>
            <button className="rounded-lg border border-border px-3 py-1.5 text-xs text-card-foreground hover:bg-muted">
              <Maximize className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
          <div className="rounded-xl border border-border bg-card p-5 overflow-y-auto">
            <h2 className="text-sm font-semibold text-card-foreground mb-3">Problem: Number of Islands</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Given an m×n 2D binary grid which represents a map of '1's (land) and '0's (water), return the number of islands.
              An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.
            </p>
            <div className="rounded-lg bg-muted p-3 text-xs font-mono text-muted-foreground mb-4">
              Input: grid = [["1","1","0"],["1","0","0"],["0","0","1"]]<br />
              Output: 2
            </div>
            <div className="border-t border-border pt-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> Interviewer Chat
              </h3>
              <div className="space-y-2">
                <div className="rounded-lg bg-accent p-2.5 text-sm text-accent-foreground">
                  Can you walk me through your approach before coding?
                </div>
              </div>
              <input
                type="text"
                placeholder="Type your response..."
                className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
            <div className="border-b border-border px-4 py-2 flex justify-between items-center">
              <span className="text-sm font-medium text-card-foreground">Solution</span>
              <button onClick={() => setPhase('feedback')} className="rounded-md bg-mastery-strong px-3 py-1.5 text-xs font-medium text-mastery-strong-foreground hover:opacity-90">
                Submit & End
              </button>
            </div>
            <textarea
              className="flex-1 w-full resize-none bg-card p-4 font-mono text-sm text-card-foreground focus:outline-none scrollbar-thin"
              defaultValue="// Write your solution here"
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-xl mx-auto mt-12">
        <div className="text-center mb-8">
          <Swords className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Mock Interview</h1>
          <p className="text-sm text-muted-foreground mt-1">Simulate a real technical interview experience</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">Duration</label>
            <div className="flex gap-2">
              {[30, 45, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setTimer(d)}
                  className={cn(
                    'flex-1 rounded-lg py-2 text-sm font-medium transition-colors',
                    timer === d ? 'bg-primary text-primary-foreground' : 'border border-border text-card-foreground hover:bg-muted'
                  )}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">Topic Focus</label>
            <select className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option>Random (Recommended)</option>
              <option>Arrays & Strings</option>
              <option>Trees & Graphs</option>
              <option>Dynamic Programming</option>
              <option>System Design</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">Difficulty</label>
            <select className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option>Medium</option>
              <option>Easy</option>
              <option>Hard</option>
            </select>
          </div>
          <button onClick={() => setPhase('coding')} className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 flex items-center justify-center gap-2">
            <Play className="h-4 w-4" /> Start Interview
          </button>
        </div>
      </div>
    </div>
  );
}
