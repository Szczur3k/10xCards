import type { APIRoute } from "astro";
import type { GeneratedFlashcardDTO, ErrorResponseDTO } from "../../../types";
import { AIGenerationService } from "../../../lib/services/ai-generation.service";

interface RegenerateFlashcardRequest {
  source_text: string;
  rejected_flashcard: {
    front: string;
    back: string;
  };
  model?: string;
  category_ids?: string[];
  group_ids?: string[];
}

interface RegenerateFlashcardResponse {
  success: boolean;
  flashcard: GeneratedFlashcardDTO;
}

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
    let requestData: RegenerateFlashcardRequest;
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

    // Validate required fields
    if (!requestData.source_text || !requestData.rejected_flashcard) {
      const errorResponse: ErrorResponseDTO = {
        error: "MISSING_REQUIRED_FIELDS",
        message: "Brak wymaganych pól: source_text, rejected_flashcard",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Note: generationCommand was removed as it's not used

    // Initialize AI generation service
    const aiGenerationService = new AIGenerationService(supabase);

    // Use new method specifically for single flashcard regeneration
    const regeneratedFlashcard = await aiGenerationService.regenerateSingleFlashcard({
      source_text: requestData.source_text,
      rejected_flashcard: requestData.rejected_flashcard,
      user_id: user.id,
      model: requestData.model,
    });

    const response: RegenerateFlashcardResponse = {
      success: true,
      flashcard: regeneratedFlashcard,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("POST /api/flashcards/regenerate error:", error);

    const errorResponse: ErrorResponseDTO = {
      error: "INTERNAL_SERVER_ERROR",
      message: "Wystąpił nieoczekiwany błąd podczas regeneracji fiszki",
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
