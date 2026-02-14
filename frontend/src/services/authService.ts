/**
 * Authentication Service
 * Handles auth operations: login, signup, logout, token refresh, password reset
 */

import { apiClient, ApiResponse } from './apiClient';
import type { User } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  token: string;
  user: User;
}

export interface PasswordResetRequest {
  email: string;
}

export interface SetPasswordRequest {
  token: string;
  password: string;
}

class AuthService {
  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>('/auth/login', { email, password });
  }

  /**
   * Sign up with name, email, and password
   */
  async signup(name: string, email: string, password: string): Promise<ApiResponse<SignupResponse>> {
    return apiClient.post<SignupResponse>('/auth/register', { name, email, password });
  }

  /**
   * Verify token validity
   */
  async verifyToken(token: string): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/auth/verify', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>('/auth/refresh', { refresh_token: refreshToken });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/auth/password-reset/request', { email });
  }

  /**
   * Set new password with reset token
   */
  async setPassword(token: string, password: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/auth/password-reset/confirm', { token, password });
  }

  /**
   * Change password (requires current auth)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.put('/auth/password', { current_password: currentPassword, new_password: newPassword });
  }

  /**
   * Logout
   */
  async logout(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/auth/logout', {});
  }
}

export const authService = new AuthService();
