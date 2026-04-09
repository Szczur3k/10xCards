import type { SignupCommand, SigninCommand, AuthResponseDTO, UserDTO } from "../../types";
import type { AstroCookies } from "astro";
import { createSupabaseServerClient } from "../../db/supabase.client";

/**
 * AuthService - handles authentication operations with Supabase SSR
 */
export class AuthService {
  private supabase: ReturnType<typeof createSupabaseServerClient>;

  constructor(context: { headers: Headers; cookies: AstroCookies }) {
    this.supabase = createSupabaseServerClient(context);
  }

  /**
   * Register new user
   */
  async signup(command: SignupCommand): Promise<AuthResponseDTO> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: command.email,
        password: command.password,
        options: {
          data: {
            email: command.email,
          },
        },
      });

      if (error) {
        throw this.mapSupabaseAuthError(error);
      }

      if (!data.user || !data.session) {
        throw {
          type: "SIGNUP_FAILED",
          message: "Nie udało się utworzyć konta użytkownika",
          statusCode: 500,
        };
      }

      return this.formatAuthResponse(data);
    } catch (error) {
      if (error && typeof error === "object" && "type" in error) {
        throw error;
      }

      console.error("Signup error:", error);
      throw {
        type: "INTERNAL_SERVER_ERROR",
        message: "Wystąpił nieoczekiwany błąd podczas rejestracji",
        statusCode: 500,
      };
    }
  }

  /**
   * Sign in existing user
   */
  async signin(command: SigninCommand): Promise<AuthResponseDTO> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: command.email,
        password: command.password,
      });

      if (error) {
        throw this.mapSupabaseAuthError(error);
      }

      if (!data.user || !data.session) {
        throw {
          type: "SIGNIN_FAILED",
          message: "Nie udało się zalogować użytkownika",
          statusCode: 500,
        };
      }

      return this.formatAuthResponse(data);
    } catch (error) {
      if (error && typeof error === "object" && "type" in error) {
        throw error;
      }

      console.error("Signin error:", error);
      throw {
        type: "INTERNAL_SERVER_ERROR",
        message: "Wystąpił nieoczekiwany błąd podczas logowania",
        statusCode: 500,
      };
    }
  }

  /**
   * Sign out user
   */
  async signout(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        throw this.mapSupabaseAuthError(error);
      }
    } catch (error) {
      if (error && typeof error === "object" && "type" in error) {
        throw error;
      }

      console.error("Signout error:", error);
      throw {
        type: "INTERNAL_SERVER_ERROR",
        message: "Wystąpił nieoczekiwany błąd podczas wylogowania",
        statusCode: 500,
      };
    }
  }

  /**
   * Get current user session
   */
  async getCurrentUser(): Promise<UserDTO | null> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser();

      if (error) {
        console.error("Get user error:", error);
        return null;
      }

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email || "",
        role: "user", // Default role, could be enhanced with user profile lookup
        created_at: user.created_at,
      };
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  }

  /**
   * Refresh user session
   */
  async refreshSession(): Promise<AuthResponseDTO | null> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();

      if (error) {
        throw this.mapSupabaseAuthError(error);
      }

      if (!data.user || !data.session) {
        return null;
      }

      return this.formatAuthResponse(data);
    } catch (error) {
      console.error("Refresh session error:", error);
      return null;
    }
  }

  /**
   * Format Supabase auth response to our DTO format
   */
  private formatAuthResponse(data: Record<string, unknown>): AuthResponseDTO {
    const user = data.user as Record<string, unknown>;
    const session = data.session as Record<string, unknown>;

    return {
      user: {
        id: user.id as string,
        email: (user.email as string) || "",
        role: "user", // Default role
        created_at: user.created_at as string,
      },
      session: {
        access_token: session.access_token as string,
        refresh_token: session.refresh_token as string,
      },
    };
  }

  /**
   * Send password reset email
   */
  async forgotPassword(command: { email: string }): Promise<void> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(command.email, {
        redirectTo: `${this.getBaseUrl()}/reset-password`,
      });

      if (error) {
        // For security, we don't throw errors that reveal if email exists
        // Just log the error and continue
        console.error("Forgot password error:", error);
      }
    } catch (error) {
      // For security, we don't throw errors that reveal if email exists
      console.error("Forgot password error:", error);
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(command: { token: string; password: string }): Promise<AuthResponseDTO> {
    try {
      // Note: In Supabase, password reset is handled via URL parameters
      // This method would be used after user clicks the reset link
      const { data, error } = await this.supabase.auth.updateUser({
        password: command.password,
      });

      if (error) {
        throw this.mapSupabaseAuthError(error);
      }

      if (!data.user) {
        throw {
          type: "RESET_PASSWORD_FAILED",
          message: "Nie udało się zresetować hasła",
          statusCode: 400,
        };
      }

      return this.formatAuthResponse(data);
    } catch (error) {
      if (error && typeof error === "object" && "type" in error) {
        throw error;
      }

      console.error("Reset password error:", error);
      throw {
        type: "INTERNAL_SERVER_ERROR",
        message: "Wystąpił nieoczekiwany błąd podczas resetowania hasła",
        statusCode: 500,
      };
    }
  }

  /**
   * Get base URL for redirects
   */
  private getBaseUrl(): string {
    // In production, this should come from environment variables
    return typeof window !== "undefined" ? window.location.origin : "http://localhost:3001";
  }

  /**
   * Map Supabase auth errors to our error format
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapSupabaseAuthError(error: any) {
    console.error("Supabase auth error:", error);

    switch (error.message) {
      case "Invalid login credentials":
        return {
          type: "INVALID_CREDENTIALS",
          message: "Nieprawidłowy email lub hasło",
          statusCode: 401,
        };

      case "User already registered":
        return {
          type: "EMAIL_ALREADY_EXISTS",
          message: "Konto z tym adresem email już istnieje",
          statusCode: 409,
        };

      case "Password should be at least 6 characters":
        return {
          type: "WEAK_PASSWORD",
          message: "Hasło musi mieć co najmniej 6 znaków",
          statusCode: 400,
        };

      case "Unable to validate email address: invalid format":
        return {
          type: "INVALID_EMAIL",
          message: "Nieprawidłowy format adresu email",
          statusCode: 400,
        };

      case "Email not confirmed":
        return {
          type: "EMAIL_NOT_VERIFIED",
          message: "Potwierdź swój adres email przed logowaniem",
          statusCode: 403,
        };

      default:
        return {
          type: "AUTH_ERROR",
          message: error.message || "Wystąpił błąd podczas uwierzytelniania",
          statusCode: 400,
        };
    }
  }
}
