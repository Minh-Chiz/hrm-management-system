import { create } from 'zustand';
import { authService } from '@/services/authService';
import { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;

  checkAuth: () => Promise<void>;
  login: (companyCode: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updatedFields: Partial<AuthUser>) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await authService.getCurrentUser();
      if (response.success && response.data) {
        set({ user: response.data, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch (e) {
      console.error('[useAuthStore] Error checking auth session:', e);
      set({ user: null, isLoading: false });
    }
  },

  login: async (companyCode: string, username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ companyCode, username, password });
      if (response.success && response.data) {
        set({ user: response.data, isLoading: false });
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
    await authService.logout();
    set({ user: null, error: null, isLoading: false });
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
