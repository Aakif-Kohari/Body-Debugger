import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  age?: number;
  healthGoals?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    name: string;
    age?: number;
    healthGoals?: string[];
  }) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');

      if (!storedToken || !storedUser) {
        setIsLoading(false);
        return;
      }

      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        const profile = await apiService.getProfile();
        const normalizedUser = normalizeUser(profile);
        setUser(normalizedUser);
        localStorage.setItem('auth_user', JSON.stringify(normalizedUser));
      } catch {
        clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const normalizeUser = (backendUser: any): User => ({
    id: backendUser.id,
    email: backendUser.email,
    name: backendUser.name,
    age: backendUser.age,
    healthGoals: backendUser.health_goals ?? backendUser.healthGoals ?? [],
  });

  const clearAuthState = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await apiService.login(email, password);
      const normalizedUser = normalizeUser(data.user);

      setToken(data.access_token);
      setUser(normalizedUser);

      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('auth_user', JSON.stringify(normalizedUser));

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    name: string;
    age?: number;
    healthGoals?: string[];
  }) => {
    try {
      const data = await apiService.register({
        ...userData,
        healthGoals: userData.healthGoals ?? [],
      });
      const normalizedUser = normalizeUser(data.user);

      setToken(data.access_token);
      setUser(normalizedUser);

      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('auth_user', JSON.stringify(normalizedUser));

    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch {
      // Logout should always clear local state even if API call fails.
    } finally {
      clearAuthState();
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};