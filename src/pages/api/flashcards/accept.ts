import type { APIContext } from "astro";
import { FlashcardService } from "../../../lib/services/flashcard.service";
import { validateCreateFlashcardRequest } from "../../../lib/validation/flashcard.schemas";
import type { CreateFlashcardCommand, ErrorResponseDTO, FlashcardDTO } from "../../../types";

// Disable prerendering for API routes
export const prerender = false;

/**
 * POST /api/flashcards/accept
 * Accepts generated flashcards and saves them to database
 * Used for AI-generated flashcards with temporary IDs
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

    // Validate request data structure
    if (!requestData || typeof requestData !== "object" || !("flashcards" in requestData)) {
      return new Response(
        JSON.stringify({
          error: "INVALID_REQUEST",
          message: "Wymagana jest tablica fiszek do akceptacji",
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { flashcards, source_text_id, category_ids, group_ids } = requestData as {
      flashcards: {
        front: string;
        back: string;
        temp_id: string;
      }[];
      source_text_id?: string;
      category_ids?: string[];
      group_ids?: string[];
    };

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      return new Response(
        JSON.stringify({
          error: "INVALID_REQUEST",
          message: "Lista fiszek nie może być pusta",
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize service
    const flashcardService = new FlashcardService(supabase);
    const acceptedFlashcards: FlashcardDTO[] = [];

    // Process each flashcard
    for (const flashcard of flashcards) {
      // Validate individual flashcard data
      const validatedData = await validateCreateFlashcardRequest({
        front: flashcard.front,
        back: flashcard.back,
        status: "draft",
      });

      // Create flashcard command
      const createCommand: CreateFlashcardCommand = {
        front: validatedData.front,
        back: validatedData.back,
        creation_type: "llm",
        status: "draft",
        user_id: user.id,
        source_text_id: source_text_id,
        category_ids: category_ids,
        group_ids: group_ids,
      };

      // Save to database
      const savedFlashcard = await flashcardService.createFlashcard(createCommand);
      acceptedFlashcards.push(savedFlashcard);
    }

    return new Response(
      JSON.stringify({
        accepted_count: acceptedFlashcards.length,
        flashcards: acceptedFlashcards,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("POST /api/flashcards/accept error:", error);

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
