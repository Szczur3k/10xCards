import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

// Protected routes that require authentication
const PROTECTED_ROUTES = ['/flashcards'];

// Public routes that should redirect authenticated users
const AUTH_ROUTES = ['/login', '/signup'];

/**
 * Authentication middleware
 * Handles JWT token validation and route protection
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Add Supabase client to context
  context.locals.supabase = supabaseClient;
  
  const { url, request, redirect } = context;
  const pathname = new URL(url).pathname;

  // Get JWT token from cookies or Authorization header
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
               context.cookies.get('auth-token')?.value;

  let isAuthenticated = false;
  let user = null;

  // Validate token if present
  if (token) {
    try {
      // For now, use simple validation - in production, verify JWT properly
      const isValidToken = token.startsWith('mock-jwt-') || token.length > 10;
      
      if (isValidToken) {
        isAuthenticated = true;
        // Mock user data - in production, decode from JWT
        user = {
          id: 'user-123',
          email: 'user@example.com',
          role: 'user'
        };
      }
    } catch (error) {
      console.error('Token validation error:', error);
      // Clear invalid token
      context.cookies.delete('auth-token');
    }
  }

  // Add auth state to context
  context.locals.user = user;
  context.locals.isAuthenticated = isAuthenticated;

  // Handle protected routes
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(pathname);
      return redirect(`/login?return=${returnUrl}`);
    }
  }

  // Handle auth routes (login/signup)
  if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    if (isAuthenticated) {
      // Check for return URL
      const returnUrl = new URL(url).searchParams.get('return');
      if (returnUrl) {
        return redirect(decodeURIComponent(returnUrl));
      }
      // Default redirect to flashcards
      return redirect('/flashcards');
    }
  }

  return next();
});
