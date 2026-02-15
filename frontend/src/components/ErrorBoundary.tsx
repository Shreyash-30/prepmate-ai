/**
 * Error Boundary Component
 * Catches errors in React components and displays a fallback UI
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Error caught:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20 dark:border-red-800">
            <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Component Error</h3>
                <p className="text-sm">{this.state.error?.message || 'An unexpected error occurred'}</p>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper for dashboard sections
 */
export function DashboardErrorBoundary({ children, sectionName = 'Dashboard Section' }: { children: React.ReactNode; sectionName?: string }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 border border-amber-200 rounded-lg bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">{sectionName} failed to load</p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
