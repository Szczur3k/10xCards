import type { 
  SignupCommand, 
  SigninCommand, 
  SignoutCommand,
  AuthResponseDTO,
  UserDTO,
  SessionDTO
} from '../../types';
import { supabaseClient } from '../../db/supabase.client';
import { isMockAuthEnabled, getMockUser } from '../auth/mock-auth';

/**
 * AuthService - handles authentication operations with dual strategy
 * - Mock auth for development/testing
 * - Supabase Auth for production
 */
export class AuthService {
  private supabase = supabaseClient;

  /**
   * Register new user
   */
  async signup(command: SignupCommand): Promise<AuthResponseDTO> {
    try {
      // Mock auth for development
      if (isMockAuthEnabled()) {
        return this.mockSignup(command);
      }

      // Real Supabase auth
      const { data, error } = await this.supabase.auth.signUp({
        email: command.email,
        password: command.password,
        options: {
          data: {
            email: command.email
          }
        }
      });

      if (error) {
        throw this.mapSupabaseAuthError(error);
      }

      if (!data.user || !data.session) {
        throw {
          type: 'SIGNUP_FAILED',
          message: 'Nie udało się utworzyć konta użytkownika',
          statusCode: 500
        };
      }

      // Get user profile from public.users table
      const userProfile = await this.getUserProfile(data.user.id);

      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          email_verified: data.user.email_confirmed_at !== null,
          role: userProfile?.role || 'user',
          created_at: data.user.created_at
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        }
      };

    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error) {
        throw error;
      }
      
      console.error('Signup error:', error);
      throw {
        type: 'INTERNAL_SERVER_ERROR',
        message: 'Wystąpił nieoczekiwany błąd podczas rejestracji',
        statusCode: 500
      };
    }
  }

  /**
   * Sign in existing user
   */
  async signin(command: SigninCommand): Promise<AuthResponseDTO> {
    try {
      // Mock auth for development
      if (isMockAuthEnabled()) {
        return this.mockSignin(command);
      }

      // Real Supabase auth
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: command.email,
        password: command.password
      });

      if (error) {
        throw this.mapSupabaseAuthError(error);
      }

      if (!data.user || !data.session) {
        throw {
          type: 'SIGNIN_FAILED',
          message: 'Nie udało się zalogować użytkownika',
          statusCode: 500
        };
      }

      // Get user profile from public.users table
      const userProfile = await this.getUserProfile(data.user.id);

      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          email_verified: data.user.email_confirmed_at !== null,
          role: userProfile?.role || 'user',
          created_at: data.user.created_at
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        }
      };

    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error) {
        throw error;
      }
      
      console.error('Signin error:', error);
      throw {
        type: 'INTERNAL_SERVER_ERROR',
        message: 'Wystąpił nieoczekiwany błąd podczas logowania',
        statusCode: 500
      };
    }
  }

  /**
   * Sign out user
   */
  async signout(command: SignoutCommand): Promise<void> {
    try {
      // Mock auth for development - no actual signout needed
      if (isMockAuthEnabled()) {
        return this.mockSignout(command);
      }

      // Real Supabase auth
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        throw this.mapSupabaseAuthError(error);
      }

    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error) {
        throw error;
      }
      
      console.error('Signout error:', error);
      throw {
        type: 'INTERNAL_SERVER_ERROR',
        message: 'Wystąpił nieoczekiwany błąd podczas wylogowania',
        statusCode: 500
      };
    }
  }

  /**
   * Get user profile from public.users table
   */
  private async getUserProfile(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Failed to get user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Mock signup for development
   */
  private async mockSignup(command: SignupCommand): Promise<AuthResponseDTO> {
    // Simulate email already exists check
    if (command.email === 'existing@example.com') {
      throw {
        type: 'EMAIL_ALREADY_EXISTS',
        message: 'Użytkownik z tym adresem email już istnieje',
        statusCode: 409
      };
    }

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const mockUser = getMockUser();
    const mockToken = this.generateMockJWT(mockUser.id);

    return {
      user: {
        id: mockUser.id,
        email: command.email,
        email_verified: false,
        role: 'user',
        created_at: new Date().toISOString()
      },
      session: {
        access_token: mockToken,
        refresh_token: mockToken + '_refresh'
      }
    };
  }

  /**
   * Mock signin for development
   */
  private async mockSignin(command: SigninCommand): Promise<AuthResponseDTO> {
    // Simulate invalid credentials
    if (command.email === 'invalid@example.com' || command.password === 'wrongpassword') {
      throw {
        type: 'INVALID_CREDENTIALS',
        message: 'Nieprawidłowy email lub hasło',
        statusCode: 401
      };
    }

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const mockUser = getMockUser();
    const mockToken = this.generateMockJWT(mockUser.id);

    return {
      user: {
        id: mockUser.id,
        email: command.email,
        email_verified: true,
        role: mockUser.role,
        created_at: mockUser.created_at
      },
      session: {
        access_token: mockToken,
        refresh_token: mockToken + '_refresh'
      }
    };
  }

  /**
   * Mock signout for development
   */
  private async mockSignout(command: SignoutCommand): Promise<void> {
    // Validate mock token format
    if (!command.accessToken.includes('mock_jwt_')) {
      throw {
        type: 'INVALID_TOKEN',
        message: 'Token autoryzacji jest nieprawidłowy lub wygasł',
        statusCode: 401
      };
    }

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * Generate mock JWT token for development
   */
  private generateMockJWT(userId: string): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ 
      sub: userId, 
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    }));
    const signature = 'mock_signature';
    
    return `mock_jwt_${header}.${payload}.${signature}`;
  }

  /**
   * Map Supabase auth errors to standardized error format
   */
  private mapSupabaseAuthError(error: any) {
    const message = error.message?.toLowerCase() || '';

    // Email already registered
    if (message.includes('user already registered') || 
        message.includes('email already registered')) {
      return {
        type: 'EMAIL_ALREADY_EXISTS',
        message: 'Użytkownik z tym adresem email już istnieje',
        statusCode: 409
      };
    }

    // Invalid credentials
    if (message.includes('invalid login credentials') ||
        message.includes('email not confirmed') ||
        message.includes('invalid email or password')) {
      return {
        type: 'INVALID_CREDENTIALS',
        message: 'Nieprawidłowy email lub hasło',
        statusCode: 401
      };
    }

    // Rate limiting
    if (message.includes('too many requests') ||
        message.includes('rate limit')) {
      return {
        type: 'RATE_LIMIT_EXCEEDED',
        message: 'Zbyt wiele prób logowania. Spróbuj ponownie za chwilę',
        statusCode: 429
      };
    }

    // Invalid token
    if (message.includes('invalid token') ||
        message.includes('jwt expired') ||
        message.includes('token expired')) {
      return {
        type: 'INVALID_TOKEN',
        message: 'Token autoryzacji jest nieprawidłowy lub wygasł',
        statusCode: 401
      };
    }

    // Default server error
    return {
      type: 'INTERNAL_SERVER_ERROR',
      message: 'Wystąpił nieoczekiwany błąd serwera',
      statusCode: 500
    };
  }
} 