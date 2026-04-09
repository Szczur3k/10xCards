import type { APIRoute } from "astro";
import type { ErrorResponseDTO } from "../../../types";
import { isMockAuth } from "../../../lib/auth-mock";
import { AuthService } from "../../../lib/services/auth.service";

export const prerender = false;

/**
 * POST /api/auth/signout
 * Sign out current user
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  if (isMockAuth()) {
    return new Response(JSON.stringify({ success: true, mock: true, message: "Wylogowano (mock)" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Create AuthService instance
    const authService = new AuthService({ headers: request.headers, cookies });

    // Execute signout through service
    await authService.signout({ accessToken: "" }); // Token will be handled by Supabase internally

    // Return success response
    return new Response(
      JSON.stringify({
        message: "Wylogowano pomyślnie",
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Signout endpoint error:", error);

    // Handle structured errors from service
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

    // For signout, we should always succeed even if there are errors
    // This prevents users from being stuck in a logged-in state
    return new Response(
      JSON.stringify({
        message: "Wylogowano pomyślnie",
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
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
