import axios, { InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { API_CONFIG } from '@/config/api';
import { getAuthToken, getRefreshToken, setAuthToken, setRefreshToken, clearTokens } from './tokenUtils';
import { useAuthStore } from '@/store/useAuthStore';

// Extended Axios internal request config to track retry status and prevent infinite loops
export interface CustomInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Interface for items queued while refreshing token
interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Refresh token state management
let isRefreshing = false;
let failedQueue: QueueItem[] = [];

/**
 * Resolves or rejects all pending requests in the failed queue
 */
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Safely triggers token clearance and store logout
 */
const handleForceLogout = async (): Promise<void> => {
  try {
    await clearTokens();
    await useAuthStore.getState().logout();
  } catch (e) {
    console.error('[apiClient] Error during force logout:', e);
  }
};

// Request Interceptor: Automatically retrieve and attach Bearer Auth Token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Retrieve access token from Zustand state first, fallback to AsyncStorage
      let token = useAuthStore.getState().token;
      if (!token) {
        token = await getAuthToken();
      }

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[apiClient] Request interceptor error fetching auth token:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global Error Handling & Refresh Token Queue Mechanism
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomInternalAxiosRequestConfig | undefined;

    // Log Network error / Server unreachable
    if (!error.response) {
      if (error.request) {
        console.error('[apiClient] Network error / Server unreachable:', error.message);
      } else {
        console.error('[apiClient] Request setup error:', error.message);
      }
      return Promise.reject(error);
    }

    const status = error.response.status;

    // Handle 401 Unauthorized Error
    if (status === 401 && originalRequest) {
      const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh');

      // Prevent Infinite Loops:
      // If request was already retried or if the error occurred on the refresh endpoint itself
      if (originalRequest._retry || isRefreshEndpoint) {
        console.warn('[apiClient] 401 error on retried request or refresh endpoint. Triggering logout.');
        await handleForceLogout();
        return Promise.reject(error);
      }

      // If a token refresh is currently in progress, enqueue incoming requests
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Mark request as retried & set refreshing status
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Retrieve current refresh token
        let refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          refreshToken = await getRefreshToken();
        }

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call the refresh endpoint using standard unintercepted axios instance to avoid recursive loops
        const refreshResponse = await axios.post<{
          token?: string;
          accessToken?: string;
          refreshToken?: string;
          data?: { token?: string; accessToken?: string; refreshToken?: string };
        }>(
          `${API_CONFIG.BASE_URL}/auth/refresh`,
          { refreshToken },
          {
            timeout: API_CONFIG.TIMEOUT_MS,
            headers: { 'Content-Type': 'application/json' },
          }
        );

        // Extract tokens from response
        const resData = refreshResponse.data.data || refreshResponse.data;
        const newAccessToken = resData.token || resData.accessToken;
        const newRefreshToken = resData.refreshToken || refreshToken;

        if (!newAccessToken) {
          throw new Error('Refresh endpoint response did not include a valid access token');
        }

        // Update tokens in persistent storage and Zustand store
        await setAuthToken(newAccessToken);
        if (newRefreshToken) {
          await setRefreshToken(newRefreshToken);
        }
        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

        // Resume all queued requests with the new access token
        processQueue(null, newAccessToken);

        // Retry original request with updated Authorization header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('[apiClient] Token refresh failed:', refreshError);
        processQueue(refreshError, null);
        await handleForceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
