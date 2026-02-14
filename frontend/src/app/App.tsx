/**
 * Main App Component
 * Root component that integrates providers and router
 * Initializes authentication state on startup
 */

import { BrowserRouter } from 'react-router-dom';
import { Providers } from './providers';
import { Router } from './router';
import useAuthInitialize from '@/hooks/useAuthInitialize';

function AppContent() {
  const { isInitializing } = useAuthInitialize();

  // Show loading screen while initializing auth
  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <h2 className="text-lg font-semibold text-slate-900">Initializing PrepMate</h2>
          <p className="text-sm text-slate-600">Setting up your session...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  );
}
