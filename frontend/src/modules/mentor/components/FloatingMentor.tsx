/**
 * Floating AI Mentor Component
 * Quick access mentor panel in bottom-right corner
 */

import { useState } from 'react';
import { Bot, X, Send } from 'lucide-react';
import { cn } from '@/utils/utils';
import { useMentorStore } from '@/store/mentorStore';
import { mentorService } from '@/services/mentorService';
import { Button } from '@/components/ui/button';

export default function FloatingMentor() {
  const [mentorOpen, setMentorOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, addMessage, isLoading, setLoading } = useMentorStore();

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
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

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setMentorOpen(!mentorOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105',
          mentorOpen && 'scale-0'
        )}
        title="Open AI Mentor"
      >
        <Bot className="h-5 w-5" />
      </button>

      {/* Mentor Panel */}
      {mentorOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 rounded-xl border border-border bg-card shadow-2xl animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-card-foreground">AI Mentor</span>
            </div>
            <button
              onClick={() => setMentorOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-3 space-y-3 scrollbar-thin">
            {messages.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground">
                <p>Hi! I'm your AI mentor.</p>
                <p>Ask me anything about your preparation.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'rounded-lg p-2 text-sm',
                    msg.role === 'user'
                      ? 'ml-8 bg-primary/10 text-primary'
                      : 'mr-8 bg-accent/10 text-accent-foreground'
                  )}
                >
                  {msg.content}
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask anything..."
                className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
              />
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
