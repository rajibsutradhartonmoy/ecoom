'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, authApi } from './api';
import type { User, AuthResponse, LoginCredentials, RegisterData } from './types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.getProfile();
        setUser(response.data as User);
      } catch {
        // Token might be expired, clear it
        apiClient.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials);
    const authData = response.data as AuthResponse;

    apiClient.setTokens(authData.accessToken, authData.refreshToken);
    setUser(authData.user);

    // Redirect based on user type
    if (authData.user.isSuperAdmin) {
      router.push('/dashboard/admin');
    } else if (authData.user.tenants.length > 0) {
      router.push('/dashboard/tenant');
    } else {
      router.push('/');
    }
  };

  const register = async (data: RegisterData) => {
    const response = await authApi.register(data);
    const authData = response.data as AuthResponse;

    apiClient.setTokens(authData.accessToken, authData.refreshToken);
    setUser(authData.user);

    // New users go to tenant setup or home
    router.push('/');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      apiClient.clearTokens();
      setUser(null);
      router.push('/auth/login');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getProfile();
      setUser(response.data as User);
    } catch {
      // If refresh fails, logout
      await logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
