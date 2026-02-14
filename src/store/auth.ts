import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: '1',
    email: 'student@example.com',
    name: 'Alex Chen',
    onboarded: true,
  },
  token: 'mock-jwt-token',
  isAuthenticated: true,
  login: async (email: string, _password: string) => {
    // Mock login - would call /api/auth/login
    set({
      user: { id: '1', email, name: 'Alex Chen', onboarded: true },
      token: 'mock-jwt-token',
      isAuthenticated: true,
    });
  },
  signup: async (name: string, email: string, _password: string) => {
    set({
      user: { id: '1', email, name, onboarded: false },
      token: 'mock-jwt-token',
      isAuthenticated: true,
    });
  },
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
