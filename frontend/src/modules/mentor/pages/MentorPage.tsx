/**
 * Mentor Page - Premium SaaS Design
 * Full AI mentor chat interface with guided learning
 */

import { useQuery } from '@tanstack/react-query';
import { mentorService } from '@/services/mentorService';
import { useMentorStore } from '@/store/mentorStore';
import { SectionHeader } from '@/components/ui/design-system';
import { Button } from '@/components/ui/button';
import { Bot, Send, Lightbulb, MessageSquare, HelpCircle, Zap } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function MentorPage() {
  const [input, setInput] = useState('');
  const { messages, addMessage, isLoading, setLoading } = useMentorStore();

  const suggestedPrompts = [
    { icon: '📚', text: 'Explain OOP concepts', emoji: 'Explain' },
    { icon: '⚡', text: 'How to optimize algorithms', emoji: 'Optimize' },
    { icon: '🐛', text: 'Debug my approach', emoji: 'Debug' },
    { icon: '📝', text: 'Interview tips', emoji: 'Tips' },
  ];

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    });

    setInput('');
    setLoading(true);

    try {
      const response = await mentorService.chat(input);
      if (response.success && response.data) {
        addMessage(response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedPrompt = (promptText: string) => {
    setInput(promptText);
  };

  return (
    <div className="space-y-6 lg:space-y-8 flex flex-col h-full">
      <SectionHeader
        title="AI Mentor"
        subtitle="Get personalized guidance and interview preparation help"
      />

      {/* Chat Container */}
      <div className="flex-1 rounded-lg border border-border/50 bg-card overflow-hidden flex flex-col min-h-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-900/10 flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Welcome to AI Mentor</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Ask me anything about interview preparation, data structures, algorithms, or coding strategies.
                </p>

                {/* Suggested Prompts */}
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Start with a topic</p>
                <div className="grid grid-cols-1 gap-2">
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedPrompt(prompt.text)}
                      className="w-full rounded-lg border border-border/50 bg-gradient-to-r from-secondary to-secondary/50 hover:from-primary-50 hover:to-primary/5 dark:hover:from-primary-900/20 dark:hover:to-primary-900/10 px-4 py-3 text-left transition-all group"
                    >
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{prompt.emoji}</p>
                      <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors mt-0.5">{prompt.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
              >
                <div className="flex gap-3 max-w-2xl">
                  {msg.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                      AI
                    </div>
                  )}
                  <div
                    className={cn(
                      'rounded-lg px-4 py-3 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-primary to-primary-600 text-primary-foreground shadow-md'
                        : 'bg-secondary/70 dark:bg-secondary/30 text-foreground border border-border/30'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className={cn(
                      'text-xs mt-1.5',
                      msg.role === 'user'
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    )}>
                      {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                  AI
                </div>
                <div className="bg-secondary/70 dark:bg-secondary/30 rounded-lg px-4 py-3 border border-border/30">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border/30 bg-gradient-to-r from-card to-secondary/30 p-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1 flex gap-2 items-center rounded-lg border border-border/50 bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-primary/30">
              <input
                type="text"
                placeholder="Ask your mentor anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none disabled:opacity-50"
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className={cn(
                'inline-flex items-center justify-center h-10 w-10 rounded-lg font-medium transition-all',
                isLoading || !input.trim()
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary to-primary-600 text-primary-foreground hover:shadow-lg'
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">💡 Tip: Be specific with your questions for better guidance</p>
        </div>
      </div>
    </div>
  );
}
