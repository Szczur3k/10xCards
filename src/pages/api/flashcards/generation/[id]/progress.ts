import type { APIContext, APIRoute } from 'astro';
import type { ErrorResponseDTO } from '../../../../../types';

export const prerender = false;

/**
 * GET /api/flashcards/generation/[id]/progress
 * Returns generation progress for a specific source text
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // Auth validation from middleware
    const { user, isAuthenticated } = context.locals;
    
    if (!isAuthenticated || !user) {
      return new Response(
        JSON.stringify({
          error: 'UNAUTHORIZED',
          message: 'Wymagane jest zalogowanie'
        } as ErrorResponseDTO),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get source text ID from params
    const sourceTextId = context.params.id;
    if (!sourceTextId) {
      return new Response(
        JSON.stringify({
          error: 'INVALID_PARAMETER',
          message: 'ID tekstu źródłowego jest wymagane'
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Mock progress response - in real implementation this would track actual generation progress
    const mockProgress = {
      source_text_id: sourceTextId,
      status: 'completed',
      progress: 100,
      current_card: 10,
      total_cards: 10,
      estimated_time_remaining: 0,
      started_at: new Date(Date.now() - 30000).toISOString(),
      completed_at: new Date().toISOString()
    };

    return new Response(JSON.stringify(mockProgress), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('GET /api/flashcards/generation/[id]/progress error:', error);

    const errorResponse: ErrorResponseDTO = {
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Wystąpił nieoczekiwany błąd podczas pobierania postępu'
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Only allow GET method for SSE
export const POST: APIRoute = async () => {
  const errorResponse: ErrorResponseDTO = {
    error: 'METHOD_NOT_ALLOWED',
    message: 'Metoda POST nie jest obsługiwana dla tego endpointu'
  };
  return new Response(JSON.stringify(errorResponse), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}; 