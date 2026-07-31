import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/config/api';
import { getAuthToken, removeAuthToken } from './tokenUtils';


const STORAGE_KEY_USER = '@hrm_auth_user';

export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically attach Bearer Auth Token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[apiClient] Error fetching auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global Error Handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // 401 Unauthorized: token expired or invalid
      if (error.response.status === 401) {
        console.warn('[apiClient] 401 Unauthorized - Clearing auth session');
        try {
          await removeAuthToken();
          await AsyncStorage.removeItem(STORAGE_KEY_USER);
        } catch (e) {
          console.error('[apiClient] Failed to clear auth session:', e);
        }
      }
    } else if (error.request) {
      console.error('[apiClient] Network error / Server unreachable:', error.message);
    } else {
      console.error('[apiClient] Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
