/**
 * useAuthInitialize Hook
 * Initializes authentication state on app startup
 * Restores persisted session and verifies token validity
 */

import { useEffect, useState } from 'react';
import { sessionService } from '@/services/sessionService';

interface UseAuthInitializeReturn {
  isInitializing: boolean;
  initError: string | null;
}

/**
 * Hook to initialize authentication on app startup
 * Should be called once at the root of the app
 */
export function useAuthInitialize(): UseAuthInitializeReturn {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setIsInitializing(true);
        setInitError(null);

        // Initialize session (restore from localStorage and verify token)
        await sessionService.initializeSession();

        if (mounted) {
          setIsInitializing(false);
        }
      } catch (error: any) {
        console.error('Failed to initialize auth:', error);
        if (mounted) {
          setInitError(error.message || 'Failed to initialize authentication');
          setIsInitializing(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  return { isInitializing, initError };
}

export default useAuthInitialize;
