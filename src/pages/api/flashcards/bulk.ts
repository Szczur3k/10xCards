import type { APIContext } from "astro";
import { FlashcardService } from "../../../lib/services/flashcard.service";
import type { ErrorResponseDTO } from "../../../types";

// Disable prerendering for API routes
export const prerender = false;

/**
 * DELETE /api/flashcards/bulk
 * Handles bulk delete operations on flashcards
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

    const { flashcard_ids } = requestData as { flashcard_ids: string[] };

    if (!flashcard_ids || !Array.isArray(flashcard_ids)) {
      return new Response(
        JSON.stringify({
          error: "INVALID_REQUEST",
          message: "Wymagane jest pole flashcard_ids",
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize service and delete flashcards
    const flashcardService = new FlashcardService(supabase);
    const result = await flashcardService.bulkDeleteFlashcards(flashcard_ids, user.id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("DELETE /api/flashcards/bulk error:", error);

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

    const errorResponse: ErrorResponseDTO = {
      error: "INTERNAL_SERVER_ERROR",
      message: "Wystąpił nieoczekiwany błąd podczas usuwania fiszek",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * PUT /api/flashcards/bulk
 * Handles bulk update operations on flashcards (change status, assign categories/groups)
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

    const { operation, flashcard_ids, data } = requestData as {
      operation: string;
      flashcard_ids: string[];
      data?: Record<string, unknown>;
    };

    if (!operation || !flashcard_ids || !Array.isArray(flashcard_ids)) {
      return new Response(
        JSON.stringify({
          error: "INVALID_REQUEST",
          message: "Wymagane są pola: operation, flashcard_ids",
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize service
    const flashcardService = new FlashcardService(supabase);
    let result;

    // Handle different bulk operations
    switch (operation) {
      case "change_status":
        if (!data?.status) {
          return new Response(
            JSON.stringify({
              error: "INVALID_REQUEST",
              message: "Status jest wymagany dla operacji change_status",
            } as ErrorResponseDTO),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        result = await flashcardService.bulkChangeStatus(flashcard_ids, data.status, user.id);
        break;

      case "assign_categories":
        if (!data?.category_ids || !Array.isArray(data.category_ids)) {
          return new Response(
            JSON.stringify({
              error: "INVALID_REQUEST",
              message: "category_ids jest wymagane dla operacji assign_categories",
            } as ErrorResponseDTO),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        result = await flashcardService.bulkAssignCategories(flashcard_ids, data.category_ids, user.id);
        break;

      case "assign_groups":
        if (!data?.group_ids || !Array.isArray(data.group_ids)) {
          return new Response(
            JSON.stringify({
              error: "INVALID_REQUEST",
              message: "group_ids jest wymagane dla operacji assign_groups",
            } as ErrorResponseDTO),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        result = await flashcardService.bulkAssignGroups(flashcard_ids, data.group_ids, user.id);
        break;

      default:
        return new Response(
          JSON.stringify({
            error: "INVALID_OPERATION",
            message: "Nieobsługiwana operacja bulk",
          } as ErrorResponseDTO),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("PUT /api/flashcards/bulk error:", error);

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

    const errorResponse: ErrorResponseDTO = {
      error: "INTERNAL_SERVER_ERROR",
      message: "Wystąpił nieoczekiwany błąd podczas operacji bulk",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * POST /api/flashcards/bulk
 * Legacy support - redirects to appropriate method
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

    // Basic validation
    if (!requestData || typeof requestData !== "object") {
      return new Response(
        JSON.stringify({
          error: "INVALID_REQUEST",
          message: "Nieprawidłowe dane żądania",
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { operation, flashcard_ids, ...operationData } = requestData as {
      operation: string;
      flashcard_ids: string[];
      [key: string]: unknown;
    };

    if (!operation || !flashcard_ids || !Array.isArray(flashcard_ids)) {
      return new Response(
        JSON.stringify({
          error: "INVALID_REQUEST",
          message: "Wymagane są pola: operation, flashcard_ids",
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize service
    const flashcardService = new FlashcardService(supabase);
    let result;

    // Handle different bulk operations
    switch (operation) {
      case "delete":
        result = await flashcardService.bulkDeleteFlashcards(flashcard_ids, user.id);
        break;

      case "change_status":
        if (!operationData.status || typeof operationData.status !== "string") {
          return new Response(
            JSON.stringify({
              error: "INVALID_REQUEST",
              message: "Status jest wymagany dla operacji change_status",
            } as ErrorResponseDTO),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        result = await flashcardService.bulkChangeStatus(
          flashcard_ids,
          operationData.status as "draft" | "published" | "archived",
          user.id
        );
        break;

      case "assign_categories":
        if (!operationData.category_ids || !Array.isArray(operationData.category_ids)) {
          return new Response(
            JSON.stringify({
              error: "INVALID_REQUEST",
              message: "category_ids jest wymagane dla operacji assign_categories",
            } as ErrorResponseDTO),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        result = await flashcardService.bulkAssignCategories(flashcard_ids, operationData.category_ids, user.id);
        break;

      case "assign_groups":
        if (!operationData.group_ids || !Array.isArray(operationData.group_ids)) {
          return new Response(
            JSON.stringify({
              error: "INVALID_REQUEST",
              message: "group_ids jest wymagane dla operacji assign_groups",
            } as ErrorResponseDTO),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        result = await flashcardService.bulkAssignGroups(flashcard_ids, operationData.group_ids, user.id);
        break;

      default:
        return new Response(
          JSON.stringify({
            error: "INVALID_OPERATION",
            message: "Nieobsługiwana operacja bulk",
          } as ErrorResponseDTO),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("POST /api/flashcards/bulk error:", error);

    // Handle service errors
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
      message: "Wystąpił nieoczekiwany błąd podczas operacji bulk",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
