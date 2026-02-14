import { useState } from 'react';
import { Bot, Send, User } from 'lucide-react';
import { api } from '@/services/api';
import type { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';

export default function MentorChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hi! I'm your AI preparation mentor. I can help you with study strategies, explain concepts, identify your weak areas, and suggest improvement plans. What would you like to work on?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const reply = await api.mentor.chat(input);
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [...prev, { id: 'err', role: 'assistant', content: 'Sorry, something went wrong. Please try again.', timestamp: new Date().toISOString() }]);
    }
    setLoading(false);
  };

  const suggestions = [
    'What should I focus on today?',
    'Explain Dynamic Programming',
    'How to improve my weak areas?',
    'Create a 2-week study plan',
  ];

  return (
    <div className="flex flex-col h-screen p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" /> AI Mentor
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Your personal preparation companion</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-4 mb-4">
        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex gap-3 animate-fade-in', msg.role === 'user' && 'justify-end')}>
            {msg.role === 'assistant' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary">
                <Bot className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            )}
            <div className={cn('max-w-lg rounded-xl px-4 py-3 text-sm leading-relaxed', msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-card-foreground')}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                <User className="h-3.5 w-3.5 text-secondary-foreground" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary">
              <Bot className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div className="bg-card border border-border rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse-soft" />
                <div className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse-soft" style={{ animationDelay: '0.2s' }} />
                <div className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse-soft" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-card-foreground hover:bg-muted transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask your mentor anything..."
          className="flex-1 rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
