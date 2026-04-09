import type { APIRoute } from "astro";
import type { GenerateFlashcardsResponseDTO, ErrorResponseDTO } from "../../../types";
import { AIGenerationService } from "../../../lib/services/ai-generation.service";
import { validateGenerateFlashcardsRequest } from "../../../lib/validation/flashcard.schemas";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Auth validation from middleware
    const { user, isAuthenticated, supabase } = locals;

    if (!isAuthenticated || !user) {
      const errorResponse: ErrorResponseDTO = {
        error: "UNAUTHORIZED",
        message: "Token autoryzacji jest wymagany",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    let requestData: unknown;
    try {
      requestData = await request.json();
    } catch {
      const errorResponse: ErrorResponseDTO = {
        error: "INVALID_JSON",
        message: "Nieprawidłowy format JSON w żądaniu",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate request data
    console.log("Received request data:", JSON.stringify(requestData, null, 2));
    const validation = validateGenerateFlashcardsRequest(requestData);
    if (!validation.success) {
      console.error("Validation failed:", JSON.stringify(validation.error, null, 2));
      return new Response(JSON.stringify(validation.error), {
        status: validation.error?.statusCode || 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validatedData = validation.data;
    if (!validatedData) {
      return new Response(
        JSON.stringify({
          error: "VALIDATION_ERROR",
          message: "Brak zwalidowanych danych",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize AI generation service
    const aiGenerationService = new AIGenerationService(supabase);
    const result: GenerateFlashcardsResponseDTO = await aiGenerationService.generateOrRegenerateFlashcards({
      user_id: user.id,
      source_text: validatedData.source_text,
      source_text_id: validatedData.source_text_id,
      max_flashcards: validatedData.max_flashcards,
      model: validatedData.model,
      category_ids: validatedData.category_ids || [],
      group_ids: validatedData.group_ids || [],
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("POST /api/flashcards/generate error:", error);

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
      message: "Wystąpił nieoczekiwany błąd podczas generowania fiszek",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Only allow POST method
export const GET: APIRoute = async () => {
  const errorResponse: ErrorResponseDTO = {
    error: "METHOD_NOT_ALLOWED",
    message: "Metoda GET nie jest obsługiwana dla tego endpointu",
  };
  return new Response(JSON.stringify(errorResponse), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
};
