/**
 * useAuth Hook
 * Convenient hook for accessing auth state and actions
 */

import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const auth = useAuthStore();
  return auth;
}
