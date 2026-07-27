import { authService } from '@/services/authService';
import { AuthUser, UserRole } from '@/types';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type { AuthUser, UserRole };

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (companyCode: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updatedFields: Partial<AuthUser>) => Promise<boolean>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check active user session on app mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await authService.getCurrentUser();
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Lỗi kiểm tra session đăng nhập:', e);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (
    companyCode: string,
    username: string,
    password: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login({ companyCode, username, password });
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setError(response.message || 'Đăng nhập thất bại');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi kết nối hệ thống';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await authService.logout();
    setUser(null);
    setError(null);
    setIsLoading(false);
  };

  const updateProfile = async (updatedFields: Partial<AuthUser>): Promise<boolean> => {
    try {
      const response = await authService.updateUserSession(updatedFields);
      if (response.success && response.data) {
        setUser(response.data);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Lỗi cập nhật hồ sơ cá nhân:', e);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateProfile, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
