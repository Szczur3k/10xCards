import type { APIRoute } from 'astro';
import type { Database } from '../../../db/database.types';
import type { 
  GenerateFlashcardsRequestDTO, 
  GenerateFlashcardsResponseDTO,
  ErrorResponseDTO 
} from '../../../types';
import { AIGenerationService } from '../../../lib/services/ai-generation.service';
import { validateGenerateFlashcardsRequest } from '../../../lib/validation/flashcard.schemas';
import { isMockAuthEnabled, getMockUser } from '../../../lib/auth/mock-auth';
import { supabaseClient } from '../../../db/supabase.client';

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Authentication
    let userId: string;
    
    if (isMockAuthEnabled()) {
      const mockUser = getMockUser();
      userId = mockUser.id;
    } else {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const errorResponse: ErrorResponseDTO = {
          error: 'UNAUTHORIZED',
          message: 'Token autoryzacji jest wymagany'
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const token = authHeader.substring(7);
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

      if (authError || !user) {
        const errorResponse: ErrorResponseDTO = {
          error: 'UNAUTHORIZED',
          message: 'Nieprawidłowy token autoryzacji'
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      userId = user.id;
    }

    // 2. Parse and validate request body
    let requestData: unknown;
    try {
      requestData = await request.json();
    } catch (error) {
      const errorResponse: ErrorResponseDTO = {
        error: 'INVALID_JSON',
        message: 'Nieprawidłowy format JSON'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const validation = validateGenerateFlashcardsRequest(requestData);
    if (!validation.success) {
      return new Response(JSON.stringify(validation.error), {
        status: validation.error!.statusCode,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const validatedData = validation.data!;

    // 3. Generate or regenerate flashcards
    const aiGenerationService = new AIGenerationService(supabaseClient);
    
    const result = await aiGenerationService.generateOrRegenerateFlashcards({
      source_text: validatedData.source_text,
      source_text_id: validatedData.source_text_id,
      user_id: userId,
      max_flashcards: validatedData.max_flashcards,
      model: validatedData.model,
      category_ids: validatedData.category_ids,
      group_ids: validatedData.group_ids
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Generate flashcards error:', error);

    // Handle structured errors from services
    if (error.type && error.statusCode) {
      const errorResponse: ErrorResponseDTO = {
        error: error.type,
        message: error.message,
        details: error.details
      };
      return new Response(JSON.stringify(errorResponse), {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle timeout errors
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      const errorResponse: ErrorResponseDTO = {
        error: 'GENERATION_TIMEOUT',
        message: 'Generowanie fiszek przekroczyło limit czasu'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 408,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle rate limiting (if implemented)
    if (error.message?.includes('rate limit')) {
      const errorResponse: ErrorResponseDTO = {
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Przekroczono limit żądań. Spróbuj ponownie później'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generic server error
    const errorResponse: ErrorResponseDTO = {
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Wystąpił wewnętrzny błąd serwera'
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Only allow POST method
export const GET: APIRoute = async () => {
  const errorResponse: ErrorResponseDTO = {
    error: 'METHOD_NOT_ALLOWED',
    message: 'Metoda GET nie jest obsługiwana dla tego endpointu'
  };
  return new Response(JSON.stringify(errorResponse), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}; 