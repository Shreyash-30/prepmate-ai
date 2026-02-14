import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState } from 'react';
import { Bot, X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppLayout() {
  const [mentorOpen, setMentorOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-60 transition-all duration-300">
        <Outlet />
      </main>

      {/* Floating AI Mentor Button */}
      <button
        onClick={() => setMentorOpen(!mentorOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105',
          mentorOpen && 'scale-0'
        )}
      >
        <Bot className="h-5 w-5" />
      </button>

      {/* Quick Mentor Panel */}
      {mentorOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 rounded-xl border border-border bg-card shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-border p-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-card-foreground">AI Mentor</span>
            </div>
            <button onClick={() => setMentorOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-64 overflow-y-auto p-3 scrollbar-thin">
            <div className="rounded-lg bg-accent p-3 text-sm text-accent-foreground">
              Hi! I'm your AI mentor. Ask me anything about your preparation strategy, topics, or problem-solving approaches.
            </div>
          </div>
          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask anything..."
                className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
