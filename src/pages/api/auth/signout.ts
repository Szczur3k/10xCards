import type { APIRoute } from 'astro';
import type { ErrorResponseDTO } from '../../../types';
import { AuthService } from '../../../lib/services/auth.service';
import { extractTokenFromHeader } from '../../../lib/validation/auth.schemas';

/**
 * POST /api/auth/signout
 * Sign out current user
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Get Authorization header
    const authHeader = request.headers.get('Authorization');
    
    // Extract and validate token
    const accessToken = extractTokenFromHeader(authHeader || '');

    // Create signout command
    const signoutCommand = {
      accessToken
    };

    // Execute signout through service
    const authService = new AuthService();
    await authService.signout(signoutCommand);

    // Return success response (204 No Content)
    return new Response(null, {
      status: 204
    });

  } catch (error: any) {
    console.error('Signout endpoint error:', error);

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