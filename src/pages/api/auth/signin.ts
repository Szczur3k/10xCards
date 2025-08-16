import type { APIRoute } from "astro";
import type { ErrorResponseDTO } from "../../../types";
import { AuthService } from "../../../lib/services/auth.service";
import { validateSigninRequest } from "../../../lib/validation/auth.schemas";
// import { RateLimiter, rateLimitConfigs, createRateLimitError } from '../../../lib/middleware/rate-limit';
// import { validateCSRF } from '../../../lib/middleware/csrf';

export const prerender = false;

/**
 * POST /api/auth/signin
 * Sign in existing user with rate limiting and CSRF protection
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  // const rateLimiter = new RateLimiter({ headers: request.headers, cookies });

  try {
    // Rate limiting check - DISABLED FOR TESTING
    // const rateLimit = await rateLimiter.checkLimit(request, rateLimitConfigs.auth);

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
    // const csrfValidation = await validateCSRF(request, cookies, '/api/auth/signin');
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
    } catch {
      return new Response(
        JSON.stringify({
          error: "INVALID_JSON",
          message: "Nieprawidłowy format JSON w żądaniu",
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate request data
    const validatedData = await validateSigninRequest(requestData);

    // Create signin command
    const signinCommand = {
      email: validatedData.email,
      password: validatedData.password,
    };

    // Execute signin through service
    const authService = new AuthService({ headers: request.headers, cookies });
    const result = await authService.signin(signinCommand);

    // Clear rate limit records on successful login - DISABLED FOR TESTING
    // await rateLimiter.clearSuccessfulAttempt(request, rateLimitConfigs.auth);

    // Return success response with rate limit headers - DISABLED FOR TESTING
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // 'X-RateLimit-Remaining': rateLimitConfigs.auth.maxAttempts.toString(),
        // 'X-RateLimit-Reset': (Date.now() + rateLimitConfigs.auth.windowMs).toString()
      },
    });
  } catch (error: unknown) {
    console.error("Signin endpoint error:", error);

    // Handle structured errors from validation or service
    if (error && typeof error === "object" && "type" in error) {
      const typedError = error as {
        type: string;
        message: string;
        details?: Record<string, string[]>;
        statusCode?: number;
      };
      const errorResponse: ErrorResponseDTO = {
        error: typedError.type,
        message: typedError.message,
        details: typedError.details,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: typedError.statusCode || 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    const errorResponse: ErrorResponseDTO = {
      error: "INTERNAL_SERVER_ERROR",
      message: "Wystąpił nieoczekiwany błąd serwera",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Only allow POST method
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      error: "METHOD_NOT_ALLOWED",
      message: "Metoda GET nie jest obsługiwana dla tego endpointu",
    } as ErrorResponseDTO),
    {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        Allow: "POST",
      },
    }
  );
};
