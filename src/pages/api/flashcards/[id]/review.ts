import type { APIContext } from "astro";
import { FlashcardService } from "../../../../lib/services/flashcard.service";
import { validateReviewFlashcardRequest, validateUUID } from "../../../../lib/validation/flashcard.schemas";
import type { ReviewFlashcardCommand, ErrorResponseDTO, FlashcardDTO } from "../../../../types";

// Disable prerendering for API routes
export const prerender = false;

/**
 * POST /api/flashcards/[id]/review
 * Reviews a flashcard (accept, reject, or edit) for the authenticated user
 */
export async function POST(context: APIContext): Promise<Response> {
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
    const validatedData = await validateReviewFlashcardRequest(requestData);

    // Create review command
    const reviewCommand: ReviewFlashcardCommand = {
      flashcardId: flashcardId,
      userId: user.id,
      action: validatedData.action,
      front: validatedData.front,
      back: validatedData.back,
      status: validatedData.status,
    };

    // Initialize service and review flashcard
    const flashcardService = new FlashcardService(supabase);
    const result: FlashcardDTO = await flashcardService.reviewFlashcard(reviewCommand);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("POST /api/flashcards/[id]/review error:", error);

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
