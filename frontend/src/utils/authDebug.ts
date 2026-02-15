/**
 * Auth Debug Utilities
 * Helpful for debugging authentication issues in development
 */

/**
 * Clear all auth data from localStorage and session
 * Useful for testing login flow from scratch
 */
export function clearAllAuthData(): void {
  console.log('[AuthDebug] Clearing all authentication data...');
  
  // Clear localStorage
  localStorage.removeItem('auth-store');
  localStorage.removeItem('user_dashboard_data');
  localStorage.removeItem('user_submissions');
  localStorage.removeItem('session-store');
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Reload page to reset auth state
  window.location.href = '/login';
}

/**
 * Get current auth state from localStorage
 */
export function getAuthState(): any {
  try {
    const stored = localStorage.getItem('auth-store');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('[AuthDebug] Error reading auth state:', error);
    return null;
  }
}

/**
 * Check if token is valid (basic check)
 */
export function isTokenValid(): boolean {
  const state = getAuthState();
  return !!(state?.token && state?.isAuthenticated);
}

/**
 * Log current auth state (for debugging)
 */
export function logAuthState(): void {
  const state = getAuthState();
  console.log('[AuthDebug] Current Auth State:', {
    hasToken: !!state?.token,
    isAuthenticated: state?.isAuthenticated,
    hasUser: !!state?.user,
    userId: state?.user?.id || 'N/A',
    userEmail: state?.user?.email || 'N/A',
  });
}

/**
 * Manually set auth state (for testing)
 * @param token - Auth token
 * @param user - User object
 */
export function setAuthStateForTesting(token: string, user: any): void {
  const state = {
    token,
    user,
    isAuthenticated: !!token,
  };
  localStorage.setItem('auth-store', JSON.stringify(state));
  console.log('[AuthDebug] Auth state set for testing');
  window.location.href = '/dashboard';
}

// If running in development, expose to window for easy debugging
if (process.env.NODE_ENV === 'development') {
  (window as any).authDebug = {
    clear: clearAllAuthData,
    getState: getAuthState,
    isValid: isTokenValid,
    log: logAuthState,
    setForTest: setAuthStateForTesting,
  };
}
