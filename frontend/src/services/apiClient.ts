/**
 * Central API Client
 * Configurable HTTP client with interceptors for all API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const API_TIMEOUT = 30000; // 30 seconds

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  params?: Record<string, string | number | boolean>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private timeout: number;

  constructor(baseUrl: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Handle 401 Unauthorized responses
   */
  private handleUnauthorized(): void {
    // Import authStore dynamically to avoid circular dependencies
    import('@/store/authStore').then(({ useAuthStore }) => {
      const store = useAuthStore.getState();
      store.logout().catch((err) => {
        console.error('Logout failed:', err);
      });
    }).catch((err) => {
      console.error('Failed to import authStore:', err);
    });
  }

  /**
   * Set authentication token for subsequent requests
   */
  setToken(token: string | null): void {
    this.token = token;
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Clear authentication token
   */
  clearToken(): void {
    this.token = null;
  }

  /**
   * Build query string from params
   */
  private buildQueryString(params?: Record<string, string | number | boolean>): string {
    if (!params) return '';
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    return searchParams.toString();
  }

  /**
   * Make HTTP request
   */
  async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.timeout,
      params,
    } = config;

    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      url.search = this.buildQueryString(params);
    }

    const finalHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (this.token) {
      finalHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url.toString(), {
        method,
        headers: finalHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');

      const responseData = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        // Handle 401 Unauthorized - auto-logout
        if (response.status === 401) {
          this.handleUnauthorized();
          return {
            success: false,
            error: 'Authentication expired. Please log in again.',
            code: '401',
          };
        }

        // Extract error message from various response formats
        let errorMessage = 'Unknown error';
        if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (responseData?.message) {
          errorMessage = responseData.message;
        } else if (responseData?.error) {
          errorMessage = typeof responseData.error === 'string' ? responseData.error : JSON.stringify(responseData.error);
        }
        
        return {
          success: false,
          error: errorMessage,
          code: String(response.status),
        };
      }

      return {
        success: true,
        data: responseData?.data || responseData,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout',
          code: 'TIMEOUT',
        };
      }

      return {
        success: false,
        error: error.message || 'Network error',
        code: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Shorthand for GET requests
   */
  get<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method'>) {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * Shorthand for POST requests
   */
  post<T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  /**
   * Shorthand for PUT requests
   */
  put<T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  /**
   * Shorthand for PATCH requests
   */
  patch<T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  /**
   * Shorthand for DELETE requests
   */
  delete<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method'>) {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
