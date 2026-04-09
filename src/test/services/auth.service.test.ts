import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "@/lib/services/auth.service";
import type { SigninCommand, SignupCommand } from "@/types";

// Mock AstroCookies
const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  getAll: vi.fn(),
  has: vi.fn(),
  merge: vi.fn(),
  headers: vi.fn(),
} as const;

// Mock Supabase client
const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
  },
};

// Mock createSupabaseServerClient
vi.mock("@/db/supabase.client", () => ({
  createSupabaseServerClient: () => mockSupabase,
}));

describe("AuthService", () => {
  let authService: AuthService;
  const mockContext = {
    headers: new Headers(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cookies: mockCookies as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService(mockContext);
  });

  describe("signin", () => {
    it("successfully signs in user with valid credentials", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        created_at: "2024-01-01T00:00:00Z",
      };

      const mockSession = {
        access_token: "access-token-123",
        refresh_token: "refresh-token-123",
        expires_at: 1234567890,
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const signinCommand: SigninCommand = {
        email: "test@example.com",
        password: "password123",
      };

      const result = await authService.signin(signinCommand);

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });

      expect(result).toEqual({
        user: {
          id: "user-123",
          email: "test@example.com",
          role: "user",
          created_at: "2024-01-01T00:00:00Z",
        },
        session: {
          access_token: "access-token-123",
          refresh_token: "refresh-token-123",
        },
      });
    });

    it("throws error when signin fails", async () => {
      const mockError = {
        message: "Invalid credentials",
        status: 400,
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const signinCommand: SigninCommand = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      await expect(authService.signin(signinCommand)).rejects.toThrow("Invalid credentials");
    });

    it("throws error when no user or session returned", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      const signinCommand: SigninCommand = {
        email: "test@example.com",
        password: "password123",
      };

      await expect(authService.signin(signinCommand)).rejects.toThrow("Nie udało się zalogować użytkownika");
    });
  });

  describe("signup", () => {
    it("successfully creates new user", async () => {
      const mockUser = {
        id: "user-123",
        email: "newuser@example.com",
        created_at: "2024-01-01T00:00:00Z",
      };

      const mockSession = {
        access_token: "access-token-123",
        refresh_token: "refresh-token-123",
        expires_at: 1234567890,
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const signupCommand: SignupCommand = {
        email: "newuser@example.com",
        password: "password123",
      };

      const result = await authService.signup(signupCommand);

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: "password123",
        options: {
          data: {
            email: "newuser@example.com",
          },
        },
      });

      expect(result).toEqual({
        user: {
          id: "user-123",
          email: "newuser@example.com",
          role: "user",
          created_at: "2024-01-01T00:00:00Z",
        },
        session: {
          access_token: "access-token-123",
          refresh_token: "refresh-token-123",
        },
      });
    });

    it("throws error when signup fails", async () => {
      const mockError = {
        message: "Email already exists",
        status: 400,
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const signupCommand: SignupCommand = {
        email: "existing@example.com",
        password: "password123",
      };

      await expect(authService.signup(signupCommand)).rejects.toThrow("Email already exists");
    });
  });

  describe("signout", () => {
    it("successfully signs out user", async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await expect(authService.signout()).resolves.toBeUndefined();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it("throws error when signout fails", async () => {
      const mockError = {
        message: "Signout failed",
        status: 500,
      };

      mockSupabase.auth.signOut.mockResolvedValue({ error: mockError });

      await expect(authService.signout()).rejects.toThrow("Signout failed");
    });
  });

  describe("getCurrentUser", () => {
    it("returns current user when authenticated", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        created_at: "2024-01-01T00:00:00Z",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await authService.getCurrentUser();

      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(result).toEqual({
        id: "user-123",
        email: "test@example.com",
        role: "user",
        created_at: "2024-01-01T00:00:00Z",
      });
    });

    it("returns null when no user authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });
});
