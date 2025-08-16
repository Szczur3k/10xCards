import type { APIContext } from "astro";
import { FlashcardService } from "../../lib/services/flashcard.service";
import { validateCreateFlashcardRequest, validateGetFlashcardsQuery } from "../../lib/validation/flashcard.schemas";
import type {
  CreateFlashcardCommand,
  ErrorResponseDTO,
  FlashcardDTO,
  FlashcardQueryParams,
  FlashcardListResponseDTO,
} from "../../types";

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/flashcards
 * Returns paginated list of user's flashcards with filtering and sorting
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

    // Parse and validate query parameters
    const url = new URL(context.request.url);
    const queryParams: FlashcardQueryParams = {
      page: parseInt(url.searchParams.get("page") || "1"),
      limit: parseInt(url.searchParams.get("limit") || "20"),
      status: url.searchParams.get("status") as any,
      creation_type: url.searchParams.get("creation_type") as any,
      category_id: url.searchParams.get("category_id") || undefined,
      group_id: url.searchParams.get("group_id") || undefined,
      sort: (url.searchParams.get("sort") as any) || "created_at",
      order: (url.searchParams.get("order") as any) || "desc",
    };

    // Initialize service and get flashcards
    const flashcardService = new FlashcardService(supabase);
    const result: FlashcardListResponseDTO = await flashcardService.getFlashcards(user.id, queryParams);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("GET /api/flashcards error:", error);

    // Handle validation errors
    if (error && typeof error === "object" && "type" in error) {
      const errorResponse: ErrorResponseDTO = {
        error: error.type,
        message: error.message,
        details: error.details,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: error.statusCode || 400,
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
 * POST /api/flashcards
 * Creates a new flashcard for the authenticated user
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
    } catch (error) {
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
    const validatedData = await validateCreateFlashcardRequest(requestData);

    // Create flashcard command
    const createCommand: CreateFlashcardCommand = {
      user_id: user.id,
      front: validatedData.front,
      back: validatedData.back,
      creation_type: "manual",
      status: validatedData.status || "draft",
      category_ids: validatedData.category_ids || [],
      group_ids: validatedData.group_ids || [],
    };

    // Initialize service and create flashcard
    const flashcardService = new FlashcardService(supabase);
    const result: FlashcardDTO = await flashcardService.createFlashcard(createCommand);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("POST /api/flashcards error:", error);

    // Handle validation errors
    if (error && typeof error === "object" && "type" in error) {
      const errorResponse: ErrorResponseDTO = {
        error: error.type,
        message: error.message,
        details: error.details,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: error.statusCode || 400,
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
