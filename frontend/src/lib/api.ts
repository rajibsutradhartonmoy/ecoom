const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
  path: string;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  setTokens(accessToken: string, refreshToken: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return null;
      }

      const data = await response.json();
      if (data.success && data.data.accessToken) {
        this.setTokens(data.data.accessToken, data.data.refreshToken);
        return data.data.accessToken;
      }

      return null;
    } catch {
      this.clearTokens();
      return null;
    }
  }

  async fetch<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true,
  ): Promise<ApiResponse<T>> {
    const accessToken = this.getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 - try to refresh token
    if (response.status === 401 && retry) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        return this.fetch<T>(endpoint, options, false);
      }
      // Redirect to login if refresh fails
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      throw new Error('Authentication required');
    }

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new ApiClientError(error.error.message, error.error.code, error.error.details);
    }

    return data as ApiResponse<T>;
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export class ApiClientError extends Error {
  code: string;
  details?: unknown;

  constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.details = details;
  }
}

export const apiClient = new ApiClient();

// Auth API
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => apiClient.post('/api/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post('/api/auth/login', data),

  logout: () => apiClient.post('/api/auth/logout'),

  getProfile: () => apiClient.get('/api/auth/me'),

  refresh: (refreshToken: string) =>
    apiClient.post('/api/auth/refresh', { refreshToken }),
};

// Tenants API (Super Admin)
export const tenantsApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    return apiClient.get(`/api/tenants?${searchParams.toString()}`);
  },

  get: (id: string) => apiClient.get(`/api/tenants/${id}`),

  create: (data: {
    name: string;
    slug: string;
    ownerEmail: string;
    ownerFirstName: string;
    ownerLastName: string;
    ownerPassword: string;
  }) => apiClient.post('/api/tenants', data),

  update: (id: string, data: { name?: string; slug?: string; status?: string }) =>
    apiClient.patch(`/api/tenants/${id}`, data),

  delete: (id: string) => apiClient.delete(`/api/tenants/${id}`),

  getStats: (id: string) => apiClient.get(`/api/tenants/${id}/stats`),
};
