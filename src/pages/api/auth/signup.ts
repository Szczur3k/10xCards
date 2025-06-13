import type { APIRoute } from 'astro';
import type { SignupRequestDTO, AuthResponseDTO, ErrorResponseDTO } from '../../../types';
import { AuthService } from '../../../lib/services/auth.service';
import { validateSignupRequest } from '../../../lib/validation/auth.schemas';

/**
 * POST /api/auth/signup
 * Register new user account
 */
export const POST: APIRoute = async ({ request }) => {
  try {
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
    const validatedData = await validateSignupRequest(requestData);

    // Create signup command
    const signupCommand = {
      email: validatedData.email,
      password: validatedData.password
    };

    // Execute signup through service
    const authService = new AuthService();
    const result = await authService.signup(signupCommand);

    // Return success response
    return new Response(
      JSON.stringify(result),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Signup endpoint error:', error);

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

    // Handle unexpected errors
    const errorResponse: ErrorResponseDTO = {
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Wystąpił nieoczekiwany błąd serwera'
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
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