// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../navigation/types';
// import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Replace with your actual auth check
      // const token = await AsyncStorage.getItem('authToken');
      // const userData = await AsyncStorage.getItem('userData');
      
      // if (token && userData) {
      //   const parsedUser = JSON.parse(userData);
      //   setUser(parsedUser);
      //   setIsAuthenticated(true);
      // }
      
      // Mock for development
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Replace with your actual login API call
      // const response = await authAPI.login(email, password);
      
      // Mock login logic based on email
      const mockUser: User = {
        id: generateUserId(),
        email: email,
        role: determineUserRole(email),
        name: extractNameFromEmail(email)
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setUser(mockUser);
      setIsAuthenticated(true);
      
      // Store auth data
      // await AsyncStorage.setItem('authToken', response.token);
      // await AsyncStorage.setItem('userData', JSON.stringify(mockUser));
      
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Clear stored auth data
      // await AsyncStorage.removeItem('authToken');
      // await AsyncStorage.removeItem('userData');
      
      // Call logout API if needed
      // await authAPI.logout();
      
      setUser(null);
      setIsAuthenticated(false);
      
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Update stored user data
      // AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
    }
  };

  // Helper functions for mock login
  const generateUserId = (): string => {
    return Math.random().toString(36).substr(2, 9);
  };

  const determineUserRole = (email: string): UserRole => {
    if (email.includes('admin')) return UserRole.ADMIN;
    if (email.includes('zonal')) return UserRole.ZONAL;
    if (email.includes('rsm')) return UserRole.RSM;
    if (email.includes('asm')) return UserRole.ASM;
    if (email.includes('distributor')) return UserRole.DISTRIBUTOR;
    if (email.includes('dealer')) return UserRole.DEALER;
    if (email.includes('subdealer')) return UserRole.SUB_DEALER;
    if (email.includes('salesman')) return UserRole.SALESMAN;
    return UserRole.SALESMAN; // Default role
  };

  const extractNameFromEmail = (email: string): string => {
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/[._-]/g, ' ');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};