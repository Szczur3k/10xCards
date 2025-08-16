import type { AstroCookies } from "astro";

export class CSRFProtection {
  private static readonly CSRF_TOKEN_HEADER = "X-CSRF-Token";
  private static readonly CSRF_COOKIE_NAME = "csrf-token";

  static generateToken(): string {
    return crypto.randomUUID();
  }

  static validateToken(request: Request, cookieToken: string): boolean {
    const headerToken = request.headers.get(this.CSRF_TOKEN_HEADER);
    return headerToken === cookieToken && headerToken !== null;
  }

  static setCSRFToken(cookies: AstroCookies): string {
    const token = this.generateToken();
    cookies.set(this.CSRF_COOKIE_NAME, token, {
      path: "/",
      secure: import.meta.env.PROD,
      httpOnly: false, // Must be accessible to JavaScript for header setting
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
    });
    return token;
  }

  static getCSRFToken(cookies: AstroCookies): string | undefined {
    return cookies.get(this.CSRF_COOKIE_NAME)?.value;
  }

  static createCSRFError() {
    return {
      error: "CSRF_TOKEN_MISMATCH",
      message: "Token CSRF jest nieprawidłowy lub brakuje",
      statusCode: 403,
    };
  }

  static shouldSkipCSRFCheck(pathname: string): boolean {
    // Skip CSRF for GET requests and certain public endpoints
    const skipPaths = [
      "/api/auth/refresh", // Session refresh should work without CSRF
    ];

    return skipPaths.some((path) => pathname.startsWith(path));
  }
}

// Helper function to check if request needs CSRF protection
export function requiresCSRFProtection(method: string, pathname: string): boolean {
  const protectedMethods = ["POST", "PUT", "DELETE", "PATCH"];
  return protectedMethods.includes(method) && !CSRFProtection.shouldSkipCSRFCheck(pathname);
}

// Middleware function for API routes
export async function validateCSRF(
  request: Request,
  cookies: AstroCookies,
  pathname: string
): Promise<{ valid: boolean; error?: any }> {
  if (!requiresCSRFProtection(request.method, pathname)) {
    return { valid: true };
  }

  const cookieToken = CSRFProtection.getCSRFToken(cookies);

  if (!cookieToken) {
    return {
      valid: false,
      error: CSRFProtection.createCSRFError(),
    };
  }

  const isValid = CSRFProtection.validateToken(request, cookieToken);

  if (!isValid) {
    return {
      valid: false,
      error: CSRFProtection.createCSRFError(),
    };
  }

  return { valid: true };
}
