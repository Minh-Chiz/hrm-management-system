import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';
import { ApiResponse } from '@/types';

export {
  TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  clearTokens,
} from './tokenUtils';

/**
 * Helper to simulate network latency for Mock API calls
 */
export const simulateDelay = (ms: number = 300): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};



/**
 * Helper for making authenticated HTTP requests to real Backend API using centralized Axios client
 */
export async function fetchWithAuth<T = any>(
  endpoint: string,
  options: { method?: string; body?: string; headers?: Record<string, string> } = {}
): Promise<ApiResponse<T>> {
  try {
    const method = (options.method || 'GET').toLowerCase();
    const data = options.body ? JSON.parse(options.body) : undefined;

    const response = await apiClient.request<ApiResponse<T>>({
      url: endpoint,
      method,
      data,
      headers: options.headers,
    });

    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return {
        success: false,
        message: error.response.data.message || error.response.data.error || `HTTP error ${error.response.status}`,
        statusCode: error.response.status,
      };
    }
    return {
      success: false,
      message: error.message || 'Lỗi kết nối tới máy chủ API.',
    };
  }
}
