import type { APIRoute } from 'astro';
import type { ErrorResponseDTO } from '../../../../../types';
import { isMockAuthEnabled, getMockUser } from '../../../../../lib/auth/mock-auth';
import { supabaseClient } from '../../../../../db/supabase.client';
import { validateUUID } from '../../../../../lib/validation/flashcard.schemas';

export const prerender = false;

/**
 * GET /api/flashcards/generation/[id]/progress
 * Server-Sent Events endpoint for simulated AI generation progress tracking
 * 
 * For MVP: Uses source_text_id as session ID and simulates progress
 * Returns stream of progress updates:
 * - generation_started: { status: 'generating', total: number }
 * - generation_progress: { status: 'generating', current: number, total: number, percentage: number }
 * - generation_completed: { status: 'completed', flashcards: [], stats: {} }
 * - generation_error: { status: 'error', error: string, message: string }
 */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    const sourceTextId = params.id;
    
    // 1. Validate source text ID
    if (!sourceTextId || !validateUUID(sourceTextId)) {
      const errorResponse: ErrorResponseDTO = {
        error: 'INVALID_SOURCE_TEXT_ID',
        message: 'Nieprawidłowy identyfikator tekstu źródłowego'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Authentication
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

    // 3. Check if source text exists and belongs to user
    const { data: sourceText, error: sourceError } = await supabaseClient
      .from('source_texts')
      .select('id, user_id, content')
      .eq('id', sourceTextId)
      .eq('user_id', userId)
      .single();

    if (sourceError || !sourceText) {
      const errorResponse: ErrorResponseDTO = {
        error: 'SOURCE_TEXT_NOT_FOUND',
        message: 'Tekst źródłowy nie został znaleziony lub nie masz uprawnień'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Set up SSE response headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control, Content-Type, Authorization',
    });

    // 5. Create readable stream for simulated progress
    const stream = new ReadableStream({
      start(controller) {
        let currentCard = 0;
        const totalCards = Math.floor(Math.random() * 3) + 4; // 4-6 cards
        let intervalId: NodeJS.Timeout;

        // Send initial status
        const initialEvent = formatSSEEvent('generation_started', {
          status: 'generating',
          current: 0,
          total: totalCards,
          percentage: 0
        });
        controller.enqueue(new TextEncoder().encode(initialEvent));

        // Simulate progress updates
        const updateProgress = () => {
          if (currentCard < totalCards) {
            currentCard++;
            const percentage = Math.round((currentCard / totalCards) * 100);
            
            const progressEvent = formatSSEEvent('generation_progress', {
              status: 'generating',
              current: currentCard,
              total: totalCards,
              percentage
            });
            controller.enqueue(new TextEncoder().encode(progressEvent));
            
            // Schedule next update with random delay
            intervalId = setTimeout(updateProgress, 800 + Math.random() * 1200);
          } else {
            // Generation completed - send mock results
            const completedEvent = formatSSEEvent('generation_completed', {
              status: 'completed',
              flashcards: generateMockFlashcards(totalCards),
              stats: {
                total_generated: totalCards,
                total_time_ms: totalCards * 1000,
                average_time_per_card_ms: 1000,
                total_tokens: totalCards * 45,
                model_used: 'gpt-4o-mini'
              }
            });
            controller.enqueue(new TextEncoder().encode(completedEvent));
            controller.close();
          }
        };

        // Start progress simulation
        intervalId = setTimeout(updateProgress, 1000);

        // Clean up on stream cancel
        return () => {
          if (intervalId) {
            clearTimeout(intervalId);
          }
        };
      },
      cancel() {
        // Cleanup will be handled by the return function above
      }
    });

    return new Response(stream, { headers });

  } catch (error: any) {
    console.error('SSE generation progress error:', error);
    
    const errorResponse: ErrorResponseDTO = {
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Wystąpił błąd podczas śledzenia postępu generowania'
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Format Server-Sent Event message
 */
function formatSSEEvent(event: string, data: any): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Generate mock flashcards for demo
 */
function generateMockFlashcards(count: number) {
  const templates = [
    {
      id: `mock-card-1`,
      front: "Co to jest TypeScript?",
      back: "TypeScript to statycznie typowany superset JavaScript",
      creation_type: 'llm',
      status: 'draft',
      confidence_score: 0.95,
      generation_time_ms: 1000
    },
    {
      id: `mock-card-2`,
      front: "Jakie są główne zalety używania React?",
      back: "React oferuje komponentową architekturę, wirtualny DOM, jednokierunkowy przepływ danych",
      creation_type: 'llm',
      status: 'draft',
      confidence_score: 0.88,
      generation_time_ms: 1200
    },
    {
      id: `mock-card-3`,
      front: "Jak działa Virtual DOM w React?",
      back: "Virtual DOM to reprezentacja prawdziwego DOM w pamięci",
      creation_type: 'llm',
      status: 'draft',
      confidence_score: 0.92,
      generation_time_ms: 900
    }
  ];

  return templates.slice(0, count).map((template, index) => ({
    ...template,
    id: `mock-card-${index + 1}`,
    front: `${template.front} (${index + 1})`
  }));
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