import React, { createContext, ReactNode, useContext, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { AuthUser, UserRole } from '@/types';

export type { AuthUser, UserRole };

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (companyCode: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updatedFields: Partial<AuthUser>) => Promise<boolean>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const clearError = useAuthStore((s) => s.clearError);

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateProfile, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('[useAuth] phải được dùng bên trong <AuthProvider>');
  }
  return context;
}
