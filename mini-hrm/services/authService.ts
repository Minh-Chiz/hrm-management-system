import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/config/api';
import { ApiResponse, AuthUser, LoginPayload } from '@/types';
import { simulateDelay, fetchWithAuth, setAuthToken, getAuthToken, removeAuthToken } from './apiUtils';

const STORAGE_KEY_USER = '@hrm_auth_user';

// Mock Account Database
const MOCK_ACCOUNTS: {
  companyCode: string;
  username: string;
  password: string;
  user: AuthUser;
}[] = [
  {
    companyCode: 'VP',
    username: 'admin',
    password: 'admin123',
    user: {
      username: 'admin',
      name: 'Quản trị viên',
      role: 'admin',
      position: 'Quản trị hệ thống',
      companyCode: 'VP',
      specialization: 'Hệ thống',
      email: 'admin@vp.com',
      phone: '0901234567',
      team: 'Ban Giám Đốc',
    },
  },
  {
    companyCode: 'VP',
    username: 'leader',
    password: 'leader123',
    user: {
      username: 'leader',
      name: 'Lê Hoàng Dương',
      role: 'teamlead',
      position: 'Team Lead - Frontend',
      companyCode: 'VP',
      specialization: 'Frontend',
      email: 'leader@vp.com',
      phone: '0987654321',
      team: 'Frontend',
    },
  },
  {
    companyCode: 'VP',
    username: 'nhanvien',
    password: 'user123',
    user: {
      username: 'nhanvien',
      name: 'Trần Văn A',
      role: 'employee',
      position: 'Frontend Developer',
      companyCode: 'VP',
      specialization: 'Software Development',
      email: 'nhanvien@vp.com',
      phone: '0912345678',
      team: 'Frontend',
    },
  },
];

const mapBackendUserToAuthUser = (backendUser: any): AuthUser => ({
  id: String(backendUser.id),
  username: backendUser.email,
  name: backendUser.name,
  role: backendUser.role,
  position: backendUser.specialization || backendUser.role,
  companyCode: 'VP',
  specialization: backendUser.specialization || '',
  email: backendUser.email,
  phone: backendUser.phone || '',
  team: backendUser.team || '',
  avatar: backendUser.avatar || undefined,
});

export const authService = {
  /**
   * Authenticate user against mock database or backend API
   */
  async login(payload: LoginPayload): Promise<ApiResponse<AuthUser>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(300);

      const normalizedCode = payload.companyCode.trim().toUpperCase();
      const normalizedUser = payload.username.trim().toLowerCase();

      const account = MOCK_ACCOUNTS.find(
        (acc) =>
          acc.companyCode === normalizedCode &&
          acc.username === normalizedUser &&
          acc.password === payload.password
      );

      if (!account) {
        return {
          success: false,
          message: 'Mã công ty, tên đăng nhập hoặc mật khẩu không đúng.',
        };
      }

      await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(account.user));
      return {
        success: true,
        data: account.user,
        message: 'Đăng nhập thành công',
      };
    } else {
      const email = payload.username.includes('@') ? payload.username.trim() : `${payload.username.trim()}@vp.com`;
      const res = await fetchWithAuth<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: payload.password }),
      });

      if (res.success && res.data) {
        await setAuthToken(res.data.token);
        const authUser = mapBackendUserToAuthUser(res.data.user);
        await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(authUser));
        return {
          success: true,
          data: authUser,
          message: res.message || 'Đăng nhập thành công',
        };
      }

      return {
        success: false,
        message: res.message || 'Đăng nhập thất bại',
      };
    }
  },

  /**
   * Clear user authentication state
   */
  async logout(): Promise<ApiResponse<null>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(200);
      await AsyncStorage.removeItem(STORAGE_KEY_USER);
      return { success: true, data: null, message: 'Đã đăng xuất' };
    } else {
      await removeAuthToken();
      await AsyncStorage.removeItem(STORAGE_KEY_USER);
      return { success: true, data: null, message: 'Đã đăng xuất' };
    }
  },

  /**
   * Get currently active logged in user from storage or server session
   */
  async getCurrentUser(): Promise<ApiResponse<AuthUser | null>> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_USER);
      const storedUser = stored ? (JSON.parse(stored) as AuthUser) : null;

      if (API_CONFIG.USE_MOCK_DATA) {
        return { success: true, data: storedUser };
      }

      const token = await getAuthToken();
      if (!token) {
        return { success: false, data: null, message: 'Chưa đăng nhập' };
      }

      const res = await fetchWithAuth<any>('/auth/me');
      if (res.success && res.data) {
        const authUser = mapBackendUserToAuthUser(res.data);
        await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(authUser));
        return { success: true, data: authUser };
      }

      // If token is invalid or expired (401), clear authentication session
      if (res.statusCode === 401) {
        await removeAuthToken();
        await AsyncStorage.removeItem(STORAGE_KEY_USER);
        return { success: false, data: null, message: res.message || 'Phiên đăng nhập đã hết hạn' };
      }

      // If backend is unreachable or network fails, fall back to stored user session
      if (storedUser) {
        return { success: true, data: storedUser };
      }

      return { success: false, data: null, message: res.message || 'Chưa đăng nhập' };
    } catch (e) {
      console.error('Lỗi khi đọc session:', e);
      return { success: false, data: null, message: 'Lỗi kiểm tra session' };
    }
  },

  /**
   * Update active user session profile
   */
  async updateUserSession(updatedFields: Partial<AuthUser>): Promise<ApiResponse<AuthUser>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(200);
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY_USER);
        if (stored) {
          const user: AuthUser = JSON.parse(stored);
          const updatedUser = { ...user, ...updatedFields };
          await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
          return { success: true, data: updatedUser, message: 'Cập nhật thông tin cá nhân thành công' };
        }
      } catch (e) {
        return { success: false, message: 'Lỗi khi cập nhật session' };
      }
      return { success: false, message: 'Không tìm thấy session' };
    } else {
      const res = await fetchWithAuth<any>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(updatedFields),
      });

      if (res.success && res.data) {
        const authUser = mapBackendUserToAuthUser(res.data);
        await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(authUser));
        return { success: true, data: authUser, message: res.message || 'Cập nhật thông tin thành công' };
      }

      return { success: false, message: res.message || 'Cập nhật thất bại' };
    }
  },
};

