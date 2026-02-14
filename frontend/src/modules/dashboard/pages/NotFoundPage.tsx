/**
 * Not Found Page (404) - Premium SaaS Design
 * User-friendly error page with guidance
 */

import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/50 p-4">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 bg-primary-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="text-center space-y-6 max-w-md relative z-10">
        {/* 404 Display */}
        <div className="mb-8">
          <div className="text-9xl font-bold bg-gradient-to-br from-primary to-primary-600 bg-clip-text text-transparent mb-2">
            404
          </div>
          <div className="text-7xl mb-4">🔍</div>
        </div>

        {/* Message */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Page Not Found</h1>
          <p className="text-muted-foreground text-base">
            The page you're looking for doesn't exist or has been moved. No worries, let's get you back on track!
          </p>
        </div>

        {/* Helpful Links */}
        <div className="rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm p-6 space-y-3">
          <p className="text-sm font-semibold text-foreground">Here's what you can do:</p>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="text-lg">✓</span>
              <span>Go back to your dashboard to continue learning</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">✓</span>
              <span>Check your bookmarks for frequently visited pages</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">✓</span>
              <span>Use the navigation menu to explore features</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border/50 hover:bg-secondary/50 text-foreground font-medium transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </button>
          <Link to="/">
            <Button className="w-full sm:w-auto gap-2 bg-gradient-to-r from-primary to-primary-600">
              <Home className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>

        {/* Contact Support */}
        <p className="pt-4 text-xs text-muted-foreground">
          Still having trouble? <a href="#" className="text-primary hover:underline font-medium">Contact support</a>
        </p>
      </div>
    </div>
  );
}
