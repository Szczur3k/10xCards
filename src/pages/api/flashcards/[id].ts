import type { APIContext } from "astro";
import { FlashcardService } from "../../../lib/services/flashcard.service";
import { validateUpdateFlashcardRequest, validateUUID } from "../../../lib/validation/flashcard.schemas";
import type { UpdateFlashcardCommand, ErrorResponseDTO, FlashcardDTO } from "../../../types";

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/flashcards/[id]
 * Returns a single flashcard by ID for the authenticated user
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // Auth validation from middleware
    const { user, isAuthenticated, supabase } = context.locals;

    if (!isAuthenticated || !user) {
      return new Response(
        JSON.stringify({
          error: "UNAUTHORIZED",
          message: "Wymagane jest zalogowanie",
        } as ErrorResponseDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate flashcard ID parameter
    const flashcardId = context.params.id;
    if (!flashcardId) {
      return new Response(
        JSON.stringify({
          error: "INVALID_PARAMETER",
          message: "ID fiszki jest wymagane",
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate UUID format
    await validateUUID(flashcardId);

    // Initialize service and get flashcard
    const flashcardService = new FlashcardService(supabase);
    const result: FlashcardDTO = await flashcardService.getById(flashcardId, user.id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("GET /api/flashcards/[id] error:", error);

    // Handle validation errors
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
        status: typedError.statusCode || 400,
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
}

/**
 * PUT /api/flashcards/[id]
 * Updates an existing flashcard for the authenticated user
 */
export async function PUT(context: APIContext): Promise<Response> {
  try {
    // Auth validation from middleware
    const { user, isAuthenticated, supabase } = context.locals;

    if (!isAuthenticated || !user) {
      return new Response(
        JSON.stringify({
          error: "UNAUTHORIZED",
          message: "Wymagane jest zalogowanie",
        } as ErrorResponseDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate flashcard ID parameter
    const flashcardId = context.params.id;
    if (!flashcardId) {
      return new Response(
        JSON.stringify({
          error: "INVALID_PARAMETER",
          message: "ID fiszki jest wymagane",
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate UUID format
    await validateUUID(flashcardId);

    // Parse request body
    let requestData: unknown;
    try {
      requestData = await context.request.json();
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
    const validatedData = await validateUpdateFlashcardRequest(requestData);

    // Create update command
    const updateCommand: UpdateFlashcardCommand = {
      id: flashcardId,
      user_id: user.id,
      front: validatedData.front,
      back: validatedData.back,
      status: validatedData.status,
      category_ids: validatedData.category_ids,
      group_ids: validatedData.group_ids,
    };

    // Initialize service and update flashcard
    const flashcardService = new FlashcardService(supabase);
    const result: FlashcardDTO = await flashcardService.updateFlashcard(updateCommand);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("PUT /api/flashcards/[id] error:", error);

    // Handle validation errors
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
        status: typedError.statusCode || 400,
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
}

/**
 * DELETE /api/flashcards/[id]
 * Deletes a flashcard for the authenticated user
 */
export async function DELETE(context: APIContext): Promise<Response> {
  try {
    // Auth validation from middleware
    const { user, isAuthenticated, supabase } = context.locals;

    if (!isAuthenticated || !user) {
      return new Response(
        JSON.stringify({
          error: "UNAUTHORIZED",
          message: "Wymagane jest zalogowanie",
        } as ErrorResponseDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate flashcard ID parameter
    const flashcardId = context.params.id;
    if (!flashcardId) {
      return new Response(
        JSON.stringify({
          error: "INVALID_PARAMETER",
          message: "ID fiszki jest wymagane",
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate UUID format
    await validateUUID(flashcardId);

    // Initialize service and delete flashcard
    const flashcardService = new FlashcardService(supabase);
    await flashcardService.deleteFlashcard(flashcardId, user.id);

    return new Response(JSON.stringify({ message: "Fiszka została usunięta" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("DELETE /api/flashcards/[id] error:", error);

    // Handle validation errors
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
        status: typedError.statusCode || 400,
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
}
