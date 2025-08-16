import type { AstroCookies } from "astro";

// Static utility functions for CSRF protection
const CSRF_TOKEN_HEADER = "X-CSRF-Token";
const CSRF_COOKIE_NAME = "csrf-token";

function generateToken(): string {
  return crypto.randomUUID();
}

function validateToken(request: Request, cookieToken: string): boolean {
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
  return headerToken === cookieToken && headerToken !== null;
}

function setCSRFToken(cookies: AstroCookies): string {
  const token = generateToken();
  cookies.set(CSRF_COOKIE_NAME, token, {
    path: "/",
    secure: import.meta.env.PROD,
    httpOnly: false, // Must be accessible to JavaScript for header setting
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
  });
  return token;
}

function getCSRFToken(cookies: AstroCookies): string | undefined {
  return cookies.get(CSRF_COOKIE_NAME)?.value;
}

function createCSRFError() {
  return {
    error: "CSRF_TOKEN_MISMATCH",
    message: "Token CSRF jest nieprawidłowy lub brakuje",
    statusCode: 403,
  };
}

function shouldSkipCSRFCheck(pathname: string): boolean {
  // Skip CSRF for GET requests and certain public endpoints
  const skipPaths = [
    "/api/auth/refresh", // Session refresh should work without CSRF
  ];

  return skipPaths.some((path) => pathname.startsWith(path));
}

// Helper function to check if request needs CSRF protection
export function requiresCSRFProtection(method: string, pathname: string): boolean {
  const protectedMethods = ["POST", "PUT", "DELETE", "PATCH"];
  return protectedMethods.includes(method) && !shouldSkipCSRFCheck(pathname);
}

// Middleware function for API routes
export async function validateCSRF(
  request: Request,
  cookies: AstroCookies,
  pathname: string
): Promise<{ valid: boolean; error?: unknown }> {
  if (!requiresCSRFProtection(request.method, pathname)) {
    return { valid: true };
  }

  const cookieToken = getCSRFToken(cookies);

  if (!cookieToken) {
    return {
      valid: false,
      error: createCSRFError(),
    };
  }

  const isValid = validateToken(request, cookieToken);

  if (!isValid) {
    return {
      valid: false,
      error: createCSRFError(),
    };
  }

  return { valid: true };
}

// Export functions for use in middleware
export { getCSRFToken, setCSRFToken, validateToken, createCSRFError, shouldSkipCSRFCheck };
