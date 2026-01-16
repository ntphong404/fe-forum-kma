import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://72.60.198.235:8080/api/v1';

// Token refresh state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Check if this request requires auth (we'll set this in custom config)
    if (config.headers?.['X-Requires-Auth'] === 'true') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      // Remove the custom header before sending
      delete config.headers['X-Requires-Auth'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 - Unauthorized (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for the refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
          }
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = response.data?.result?.accessToken || response.data?.accessToken;

        if (!newAccessToken) {
          throw new Error('No access token in refresh response');
        }

        localStorage.setItem('accessToken', newAccessToken);
        processQueue(null, newAccessToken);
        isRefreshing = false;

        // Retry the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Clear auth and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // Use window.location for service-level redirect (cannot use navigate here)
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export class ApiService {
  private static getAuthToken(): string | null {
    try {
      return localStorage.getItem('accessToken');
    } catch {
      return null;
    }
  }

  private static extractData<T>(responseData: any): T {
    // Check if backend returned an error in the response body (code !== "200")
    if (responseData && typeof responseData === 'object' && 'code' in responseData) {
      // PS_015 is a special case: interaction removed (toggle) - not an error
      const isInteractionRemoved = responseData.code === 'PS_015';
      
      // AS_010 is 2FA required - return with code so caller can handle it
      const is2FARequired = responseData.code === 'AS_010';

      if (responseData.code !== '200' && responseData.code !== 200 && !isInteractionRemoved && !is2FARequired) {
        throw {
          message: responseData.message || 'Request failed',
          code: responseData.code,
        };
      }
      
      // For 2FA required, return the full response with code
      if (is2FARequired) {
        return {
          code: responseData.code,
          message: responseData.message,
          ...responseData.result,
        } as T;
      }
    }

    // If response has the API structure {code, message, data/result}, return data/result
    if (responseData && typeof responseData === 'object') {
      // Check for 'result' field (backend uses 'result' not 'data')
      if ('result' in responseData) {
        return responseData.result as T;
      }
      // Fallback to 'data' field
      if ('data' in responseData) {
        return responseData.data as T;
      }
    }

    return responseData as T;
  }

  private static handleError(error: AxiosError): never {
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data as any;
      throw {
        message: errorData?.message || error.message || 'Request failed',
        statusCode: error.response.status,
        code: errorData?.code,
        errors: errorData?.errors,
      };
    } else if (error.request) {
      // Request was made but no response received
      throw {
        message: 'Network error - no response received',
        statusCode: 0,
      };
    } else {
      // Error setting up the request
      throw {
        message: error.message || 'Request setup error',
        statusCode: 0,
      };
    }
  }

  static async get<T>(endpoint: string, requiresAuth: boolean = false): Promise<T> {
    try {
      const response = await axiosInstance.get(endpoint, {
        headers: requiresAuth ? { 'X-Requires-Auth': 'true' } : {},
      });
      return this.extractData<T>(response.data);
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  static async post<T>(
    endpoint: string,
    data: any,
    requiresAuth: boolean = false
  ): Promise<T> {
    try {
      const response = await axiosInstance.post(endpoint, data, {
        headers: requiresAuth ? { 'X-Requires-Auth': 'true' } : {},
      });
      return this.extractData<T>(response.data);
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  static async put<T>(
    endpoint: string,
    data: any,
    requiresAuth: boolean = false
  ): Promise<T> {
    try {
      const response = await axiosInstance.put(endpoint, data, {
        headers: requiresAuth ? { 'X-Requires-Auth': 'true' } : {},
      });
      return this.extractData<T>(response.data);
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  static async delete<T>(endpoint: string, requiresAuth: boolean = false): Promise<T> {
    try {
      const response = await axiosInstance.delete(endpoint, {
        headers: requiresAuth ? { 'X-Requires-Auth': 'true' } : {},
      });
      return this.extractData<T>(response.data);
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  static async patch<T>(
    endpoint: string,
    data: any,
    requiresAuth: boolean = false
  ): Promise<T> {
    try {
      const response = await axiosInstance.patch(endpoint, data, {
        headers: requiresAuth ? { 'X-Requires-Auth': 'true' } : {},
      });
      return this.extractData<T>(response.data);
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Upload file using multipart/form-data
   */
  static async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>,
    requiresAuth: boolean = true
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    // Add any additional data fields
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    }

    try {
      // Build headers - DON'T set Content-Type, let browser handle it for FormData
      const headers: Record<string, string> = {};

      if (requiresAuth) {
        const token = this.getAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      // Use axios directly (not axiosInstance) to avoid default Content-Type: application/json
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, formData, {
        headers,
        timeout: 60000, // 60 seconds for uploads
      });

      const responseData = response.data;

      // Check for error codes (code is string "200" not number)
      if (responseData && typeof responseData === 'object' && 'code' in responseData) {
        const code = String(responseData.code);
        if (code !== '200') {
          throw {
            message: responseData.message || 'Upload failed',
            code: responseData.code,
          };
        }
      }

      // Extract result/data from response
      if ('result' in responseData) {
        return responseData.result as T;
      }
      if ('data' in responseData) {
        return responseData.data as T;
      }

      return responseData as T;
    } catch (error) {
      if ((error as any).statusCode || (error as any).code) {
        throw error;
      }
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Legacy request method for backward compatibility
   * @deprecated Use specific methods (get, post, put, delete, patch) instead
   */
  static async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth: boolean = false
  ): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    const data = options.body ? JSON.parse(options.body as string) : undefined;

    switch (method) {
      case 'GET':
        return this.get<T>(endpoint, requiresAuth);
      case 'POST':
        return this.post<T>(endpoint, data, requiresAuth);
      case 'PUT':
        return this.put<T>(endpoint, data, requiresAuth);
      case 'DELETE':
        return this.delete<T>(endpoint, requiresAuth);
      case 'PATCH':
        return this.patch<T>(endpoint, data, requiresAuth);
      default:
        return this.get<T>(endpoint, requiresAuth);
    }
  }
}

// Export axios instance for advanced usage
export { axiosInstance };

