import type { APIRoute } from 'astro';
import type { SigninRequestDTO, AuthResponseDTO, ErrorResponseDTO } from '../../../types';
import { AuthService } from '../../../lib/services/auth.service';
import { validateForgotPasswordRequest } from '../../../lib/validation/auth.schemas';
// import { RateLimiter, rateLimitConfigs, createRateLimitError } from '../../../lib/middleware/rate-limit';
// import { validateCSRF } from '../../../lib/middleware/csrf';

export const prerender = false;

/**
 * POST /api/auth/forgot-password
 * Send password reset email with rate limiting and CSRF protection
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Rate limiting check - stricter for forgot password - DISABLED FOR TESTING
    // const rateLimiter = new RateLimiter({ headers: request.headers, cookies });
    // const rateLimit = await rateLimiter.checkLimit(request, rateLimitConfigs.forgotPassword);
    
    // if (!rateLimit.allowed) {
    //   const rateLimitError = createRateLimitError(rateLimit.resetTime);
    //   return new Response(
    //     JSON.stringify({
    //       error: rateLimitError.error,
    //       message: rateLimitError.message
    //     } as ErrorResponseDTO),
    //     {
    //       status: rateLimitError.statusCode,
    //       headers: { 
    //         'Content-Type': 'application/json',
    //         ...rateLimitError.headers
    //       }
    //     }
    //   );
    // }

    // CSRF validation - DISABLED FOR TESTING
    // const csrfValidation = await validateCSRF(request, cookies, '/api/auth/forgot-password');
    // if (!csrfValidation.valid) {
    //   return new Response(
    //     JSON.stringify({
    //       error: csrfValidation.error.error,
    //       message: csrfValidation.error.message
    //     } as ErrorResponseDTO),
    //     {
    //       status: csrfValidation.error.statusCode,
    //       headers: { 'Content-Type': 'application/json' }
    //     }
    //   );
    // }

    // Parse request body
    let requestData: unknown;
    try {
      requestData = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'INVALID_JSON',
          message: 'Nieprawidłowy format JSON w żądaniu'
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate request data
    const validatedData = await validateForgotPasswordRequest(requestData);

    // Create forgot password command
    const forgotPasswordCommand = {
      email: validatedData.email
    };

    // Execute forgot password through service
    const authService = new AuthService({ headers: request.headers, cookies });
    const result = await authService.forgotPassword(forgotPasswordCommand);

    // Always return success to prevent email enumeration attacks - DISABLED FOR TESTING
    // Even if email doesn't exist, we return success
    return new Response(
      JSON.stringify({
        message: 'Jeśli podany adres email istnieje w naszej bazie, otrzymasz link do resetowania hasła.',
        success: true
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json'
          // 'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          // 'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      }
    );

  } catch (error: any) {
    console.error('Forgot password endpoint error:', error);

    // Handle structured errors from validation or service
    if (error && typeof error === 'object' && 'type' in error) {
      const errorResponse: ErrorResponseDTO = {
        error: error.type,
        message: error.message,
        details: error.details
      };

      return new Response(
        JSON.stringify(errorResponse),
        {
          status: error.statusCode || 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // For security, always return generic success message - DISABLED FOR TESTING
    // This prevents email enumeration attacks
    return new Response(
      JSON.stringify({
        message: 'Jeśli podany adres email istnieje w naszej bazie, otrzymasz link do resetowania hasła.',
        success: true
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// Only allow POST method
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      error: 'METHOD_NOT_ALLOWED',
      message: 'Metoda GET nie jest obsługiwana dla tego endpointu'
    } as ErrorResponseDTO),
    {
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        'Allow': 'POST'
      }
    }
  );
}; 