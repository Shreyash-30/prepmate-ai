/**
 * Session Service
 * Handles session initialization, verification, and restoration
 * Runs on app startup to restore persisted authentication state
 */

import { apiClient } from './apiClient';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

export interface SessionVerifyResponse {
  success: boolean;
  data?: {
    user: User;
  };
  error?: string;
}

class SessionService {
  /**
   * Initialize session on app startup
   * Restores auth state from localStorage and verifies token validity
   */
  async initializeSession(): Promise<void> {
    const authStore = useAuthStore.getState();
    const token = authStore.token;

    // If no token is stored, session is not initialized
    if (!token) {
      return;
    }

    // Set token in API client from store
    apiClient.setToken(token);

    // Verify token is still valid by calling /auth/me endpoint
    try {
      const response = await this.verifyToken();
      if (response.success && response.data?.user) {
        // Token is valid, update store with fresh user data
        authStore.setUser(response.data.user);
      } else {
        // Token verification failed, clear authentication
        if (response.error) {
          console.warn('Session verification error:', response.error);
        }
        this.clearSession();
      }
    } catch (error: any) {
      // Error verifying token (network error, server down, etc.)
      // Clear session on error to be safe
      console.warn('Session verification failed:', error);
      this.clearSession();
    }
  }

  /**
   * Verify current token is valid
   */
  async verifyToken(): Promise<SessionVerifyResponse> {
    try {
      const response = await apiClient.get('/auth/me');
      return response as any;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Token verification failed',
      };
    }
  }

  /**
   * Clear session on logout or token expiry
   */
  clearSession(): void {
    const authStore = useAuthStore.getState();
    authStore.logout();
  }

  /**
   * Restore session from token (used after login/signup)
   */
  restoreSession(token: string): void {
    const authStore = useAuthStore.getState();
    authStore.setToken(token);
    apiClient.setToken(token);
  }
}

export const sessionService = new SessionService();
