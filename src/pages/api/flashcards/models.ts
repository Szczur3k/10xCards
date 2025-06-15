import type { APIContext } from 'astro';
import type { ModelsResponseDTO, GetAvailableModelsCommand, ErrorResponseDTO } from '../../../types';
import { AIModelService } from '../../../lib/services/ai-model.service';

/**
 * GET /api/flashcards/models
 * Returns available AI models for flashcard generation
 * 
 * Features:
 * - Real authentication from middleware
 * - Real-time API key availability checking
 * - Intelligent model selection strategy
 * - Response caching (5 minutes TTL)
 * - Comprehensive error handling
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // Auth validation from middleware
    const { user, isAuthenticated } = context.locals;
    
    if (!isAuthenticated || !user) {
      return new Response(
        JSON.stringify({
          error: 'UNAUTHORIZED',
          message: 'Token autoryzacji jest wymagany lub nieprawidłowy'
        } as ErrorResponseDTO),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize service and create command
    const aiModelService = new AIModelService();
    const command: GetAvailableModelsCommand = {
      user_id: user.id
    };

    // Get available models
    const modelsResponse: ModelsResponseDTO = await aiModelService.getAvailableModels(command);

    // Return success response with caching headers
    return new Response(JSON.stringify(modelsResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 minutes cache
        'X-Total-Models': modelsResponse.stats.total_models.toString(),
        'X-Available-Models': modelsResponse.stats.available_models.toString()
      }
    });

  } catch (error: any) {
    console.error('GET /api/flashcards/models error:', error);

    // Handle service-specific errors
    if (error && typeof error === 'object' && 'type' in error) {
      const errorResponse: ErrorResponseDTO = {
        error: error.type,
        message: error.message,
        details: error.details
      };

      return new Response(JSON.stringify(errorResponse), {
        status: error.statusCode || 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle unexpected errors
    const errorResponse: ErrorResponseDTO = {
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Wystąpił nieoczekiwany błąd podczas pobierania modeli AI'
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
} 