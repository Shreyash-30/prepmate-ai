/**
 * Error Handler Service
 * Centralized error handling and user notification
 */

import { useAuthStore } from '@/store/authStore';

export interface ApiError {
  code?: string;
  message: string;
  details?: any;
  statusCode?: number;
}

class ErrorHandler {
  /**
   * Handle API error and extract meaningful message
   */
  handleApiError(error: any): ApiError {
    // Network error
    if (error.code === 'NETWORK_ERROR') {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.',
        statusCode: 0,
      };
    }

    // Timeout error
    if (error.code === 'TIMEOUT') {
      return {
        code: 'TIMEOUT',
        message: 'Request timeout. Please try again.',
        statusCode: 408,
      };
    }

    // Authentication error - token expired or invalid
    if (error.statusCode === 401 || error.code === '401') {
      // Clear auth state
      const authStore = useAuthStore.getState();
      authStore.logout();

      return {
        code: 'UNAUTHORIZED',
        message: 'Your session expired. Please login again.',
        statusCode: 401,
      };
    }

    // Forbidden error
    if (error.statusCode === 403 || error.code === '403') {
      return {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this resource.',
        statusCode: 403,
      };
    }

    // Not found error
    if (error.statusCode === 404 || error.code === '404') {
      return {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found.',
        statusCode: 404,
      };
    }

    // Validation error
    if (error.statusCode === 422 || error.code === '422') {
      return {
        code: 'VALIDATION_ERROR',
        message: error.message || 'Please check your input and try again.',
        statusCode: 422,
        details: error.details,
      };
    }

    // Server error
    if (error.statusCode === 500 || error.code === '500') {
      return {
        code: 'SERVER_ERROR',
        message: 'Server error. Please try again later.',
        statusCode: 500,
      };
    }

    // Generic error
    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred. Please try again.',
      statusCode: error.statusCode,
    };
  }

  /**
   * Format error for user-facing display
   */
  formatUserMessage(error: any): string {
    const handledError = this.handleApiError(error);
    return handledError.message;
  }

  /**
   * Log error for debugging (conditional based on environment)
   */
  logError(error: any, context?: string): void {
    if (import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true') {
      console.error(
        `[Error${context ? ` - ${context}` : ''}]`,
        error
      );
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: any): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT',
      408, // Request Timeout
      429, // Too Many Requests
      500, // Internal Server Error
      502, // Bad Gateway
      503, // Service Unavailable
      504, // Gateway Timeout
    ];

    return retryableCodes.includes(error.code) || retryableCodes.includes(error.statusCode);
  }
}

export const errorHandler = new ErrorHandler();
