import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { UserDTO } from '../../types';
import { AuthService } from '../../lib/services/auth.service';
import { isMockAuthEnabled, getMockUser } from '../../lib/auth/mock-auth';

interface AuthContextType {
  user: UserDTO | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider - Provides authentication context to the application
 * Uses existing AuthService with dual strategy (mock/real auth)
 * Integrates with project's mock authentication system
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authService = typeof window !== 'undefined' ? new AuthService() : null;

  const isAuthenticated = !!user;

  useEffect(() => {
    // Initialize user session on mount
    const initializeAuth = async () => {
      try {
        if (isMockAuthEnabled()) {
          // Use existing mock system
          const mockUser = getMockUser();
          setUser({
            id: mockUser.id,
            email: mockUser.email,
            email_verified: true,
            role: mockUser.role,
            created_at: mockUser.created_at
          });
        } else {
          // TODO: Check for existing real session
          // For now, no auto-login for real auth
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (!authService) throw new Error('Auth service not available');
      const authResponse = await authService.signin({ email, password });
      setUser(authResponse.user);
      
      // Store session data if needed
      if (authResponse.session) {
        localStorage.setItem('access_token', authResponse.session.access_token);
        localStorage.setItem('refresh_token', authResponse.session.refresh_token);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken && authService) {
        await authService.signout({ accessToken });
      }
      
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if API call fails
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth - Hook to access authentication context
 * Throws error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 