import { create } from 'zustand';
import { authService } from '@/services/authService';
import { getAuthToken, getRefreshToken, clearTokens } from '@/services/tokenUtils';
import { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  checkAuth: () => Promise<void>;
  login: (companyCode: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updatedFields: Partial<AuthUser>) => Promise<boolean>;
  clearError: () => void;
  setTokens: (token: string, refreshToken?: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: true,
  error: null,

  setTokens: (token: string, refreshToken?: string | null) => {
    set((state) => ({
      token,
      refreshToken: refreshToken !== undefined ? refreshToken : state.refreshToken,
    }));
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await getAuthToken();
      const refreshToken = await getRefreshToken();
      const response = await authService.getCurrentUser();
      if (response.success && response.data) {
        set({ user: response.data, token, refreshToken, isLoading: false });
      } else {
        set({ user: null, token: null, refreshToken: null, isLoading: false });
      }
    } catch (e) {
      console.error('[useAuthStore] Error checking auth session:', e);
      set({ user: null, token: null, refreshToken: null, isLoading: false });
    }
  },

  login: async (companyCode: string, username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ companyCode, username, password });
      if (response.success && response.data) {
        const token = await getAuthToken();
        const refreshToken = await getRefreshToken();
        set({ user: response.data, token, refreshToken, isLoading: false });
      } else {
        set({ error: response.message || 'Đăng nhập thất bại', isLoading: false });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi kết nối hệ thống';
      set({ error: errorMessage, isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
      await clearTokens();
    } catch (e) {
      console.error('[useAuthStore] Error during logout:', e);
    } finally {
      set({ user: null, token: null, refreshToken: null, error: null, isLoading: false });
    }
  },

  updateProfile: async (updatedFields: Partial<AuthUser>) => {
    try {
      const response = await authService.updateUserSession(updatedFields);
      if (response.success && response.data) {
        set({ user: response.data });
        return true;
      }
      return false;
    } catch (e) {
      console.error('[useAuthStore] Error updating profile session:', e);
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
