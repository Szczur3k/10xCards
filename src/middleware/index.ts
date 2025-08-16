import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "../db/supabase.client";
import { getCSRFToken, setCSRFToken } from "../lib/middleware/csrf";

// Protected routes that require authentication
const PROTECTED_ROUTES = ["/flashcards"];

// Public routes that should redirect authenticated users
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

// API routes that don't need CSRF protection
// const CSRF_EXEMPT_ROUTES = ["/api/auth/refresh"];

/**
 * Authentication and security middleware
 * Handles Supabase SSR auth, CSRF protection, and route protection
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, redirect, cookies } = context;
  const pathname = new URL(url).pathname;

  // Create Supabase client for this request
  const supabase = createSupabaseServerClient({
    headers: request.headers,
    cookies: cookies,
  });

  // Add Supabase client to context
  context.locals.supabase = supabase;

  // Get current user session
  let isAuthenticated = false;
  let user = null;

  try {
    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser();

    if (supabaseUser && !error) {
      isAuthenticated = true;
      user = {
        id: supabaseUser.id,
        email: supabaseUser.email || "",
        role: "user", // Default role
        created_at: supabaseUser.created_at,
      };
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    // Continue with unauthenticated state
  }

  // Add auth state to context
  context.locals.user = user;
  context.locals.isAuthenticated = isAuthenticated;

  // Set CSRF token for authenticated users and forms
  if (isAuthenticated || AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    // Ensure CSRF token exists
    let csrfToken = getCSRFToken(cookies);
    if (!csrfToken) {
      csrfToken = setCSRFToken(cookies);
    }

    // Add CSRF token to locals for use in templates
    context.locals.csrfToken = csrfToken;
  }

  // Handle protected routes
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(pathname + url.search);
      return redirect(`/login?return=${returnUrl}`);
    }
  }

  // Handle auth routes (login/signup/forgot-password/reset-password)
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      // Check for return URL
      const returnUrl = new URL(url).searchParams.get("return");
      if (returnUrl) {
        try {
          const decodedUrl = decodeURIComponent(returnUrl);
          // Validate return URL is safe (same origin)
          if (decodedUrl.startsWith("/") && !decodedUrl.startsWith("//")) {
            return redirect(decodedUrl);
          }
        } catch {
          console.error("Invalid return URL:", returnUrl);
        }
      }
      // Default redirect to flashcards
      return redirect("/flashcards");
    }
  }

  return next();
});
