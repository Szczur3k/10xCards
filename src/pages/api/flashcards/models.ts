import type { APIContext } from 'astro';
import type { ModelsResponseDTO, GetAvailableModelsCommand, ErrorResponseDTO } from '../../../types';
import { AIModelService } from '../../../lib/services/ai-model.service';
import { isMockAuthEnabled, getMockUser } from '../../../lib/auth/mock-auth';
import { supabaseClient } from '../../../db/supabase.client';

/**
 * GET /api/flashcards/models
 * Returns available AI models for flashcard generation
 * 
 * Features:
 * - Mock authentication support for development
 * - Real-time API key availability checking
 * - Intelligent model selection strategy
 * - Response caching (5 minutes TTL)
 * - Comprehensive error handling
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // Auth validation - support both mock and real auth
    let user: any;
    
    if (isMockAuthEnabled()) {
      console.log('🔧 Using mock authentication for models endpoint');
      user = getMockUser();
    } else {
      // Real Supabase auth
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();
      
      if (authError || !authUser) {
        return new Response(
          JSON.stringify({
            error: 'UNAUTHORIZED',
            message: 'Token autoryzacji jest wymagany lub nieprawidłowy'
          } as ErrorResponseDTO),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
      
      user = authUser;
    }

    // Initialize service and create command
    const aiModelService = new AIModelService();
    const command: GetAvailableModelsCommand = {
      user_id: user.id
    };

    // Get available models
    const modelsResponse: ModelsResponseDTO = await aiModelService.getAvailableModels(command);

    // Success response with caching headers
    return new Response(
      JSON.stringify(modelsResponse),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300', // 5 minutes cache
          'Vary': 'Authorization'
        }
      }
    );

  } catch (error: any) {
    console.error('GET /api/flashcards/models error:', error);

    // Handle structured errors from service layer
    if (error.type && error.statusCode) {
      const errorResponse: ErrorResponseDTO = {
        error: error.type,
        message: error.message,
        details: error.details
      };

      return new Response(
        JSON.stringify(errorResponse),
        {
          status: error.statusCode,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Handle authentication errors
    if (error.message?.includes('auth') || error.message?.includes('token')) {
      const errorResponse: ErrorResponseDTO = {
        error: 'UNAUTHORIZED',
        message: 'Token autoryzacji jest wymagany lub nieprawidłowy'
      };

      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Handle environment/configuration errors
    if (error.message?.includes('environment') || error.message?.includes('config')) {
      const errorResponse: ErrorResponseDTO = {
        error: 'CONFIGURATION_ERROR',
        message: 'Błąd konfiguracji modeli AI',
        details: { configuration: ['Nieprawidłowa konfiguracja modeli w systemie'] }
      };

      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Generic server error
    const errorResponse: ErrorResponseDTO = {
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Wystąpił wewnętrzny błąd serwera'
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
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