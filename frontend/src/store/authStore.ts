/**
 * Auth Store
 * Global authentication state and actions
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/authService';
import { userDataService } from '@/services/userDataService';
import type { User } from '@/types';
import { apiClient } from '@/services/apiClient';
import { getErrorMessage } from '@/utils/errorUtils';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(email, password);
          if (response.success && response.data) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            });
            apiClient.setToken(response.data.token);
            
            // Fetch user data and trigger ML processing after login
            await userDataService.fetchUserDataAfterLogin();
            userDataService.triggerMLProcessing().catch(err => {
              console.error('ML processing failed (non-critical):', err);
            });
          } else {
            const errorMsg = getErrorMessage(response.error || 'Login failed');
            set({ error: errorMsg, isLoading: false });
          }
        } catch (error: any) {
          const errorMsg = getErrorMessage(error);
          set({ error: errorMsg, isLoading: false });
        }
      },

      signup: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.signup(name, email, password);
          if (response.success && response.data) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            });
            apiClient.setToken(response.data.token);
            
            // Fetch user data and trigger ML processing after signup
            await userDataService.fetchUserDataAfterLogin();
            userDataService.triggerMLProcessing().catch(err => {
              console.error('ML processing failed (non-critical):', err);
            });
          } else {
            const errorMsg = getErrorMessage(response.error || 'Signup failed');
            set({ error: errorMsg, isLoading: false });
          }
        } catch (error: any) {
          const errorMsg = getErrorMessage(error);
          set({ error: errorMsg, isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          apiClient.clearToken();
          // Clear cached user data on logout
          userDataService.clearCachedData();
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      setToken: (token: string) => {
        set({ token, isAuthenticated: true });
        apiClient.setToken(token);
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        if (state && state.token) {
          apiClient.setToken(state.token);
        } else {
          // Ensure isAuthenticated is false if there's no token
          if (state) {
            state.isAuthenticated = false;
          }
        }
      },
    }
  )
);
