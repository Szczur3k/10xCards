import type { APIContext } from 'astro';
import { FlashcardService } from '../../../lib/services/flashcard.service';
import type { ErrorResponseDTO } from '../../../types';

// Disable prerendering for API routes
export const prerender = false;

/**
 * POST /api/flashcards/bulk
 * Handles bulk operations on flashcards (delete, change status, assign categories/groups)
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    // Auth validation from middleware
    const { user, isAuthenticated, supabase } = context.locals;
    
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

    // Parse request body
    let requestData: unknown;
    try {
      requestData = await context.request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'INVALID_JSON',
          message: 'Nieprawidłowy format JSON w żądaniu'
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Basic validation
    if (!requestData || typeof requestData !== 'object') {
      return new Response(
        JSON.stringify({
          error: 'INVALID_REQUEST',
          message: 'Nieprawidłowe dane żądania'
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { operation, flashcard_ids, ...operationData } = requestData as any;

    if (!operation || !flashcard_ids || !Array.isArray(flashcard_ids)) {
      return new Response(
        JSON.stringify({
          error: 'INVALID_REQUEST',
          message: 'Wymagane są pola: operation, flashcard_ids'
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize service
    const flashcardService = new FlashcardService(supabase);
    let result;

    // Handle different bulk operations
    switch (operation) {
      case 'delete':
        result = await flashcardService.bulkDeleteFlashcards(flashcard_ids, user.id);
        break;
      
      case 'change_status':
        if (!operationData.status) {
          return new Response(
            JSON.stringify({
              error: 'INVALID_REQUEST',
              message: 'Status jest wymagany dla operacji change_status'
            } as ErrorResponseDTO),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
        result = await flashcardService.bulkChangeStatus(flashcard_ids, operationData.status, user.id);
        break;
      
      case 'assign_categories':
        if (!operationData.category_ids || !Array.isArray(operationData.category_ids)) {
          return new Response(
            JSON.stringify({
              error: 'INVALID_REQUEST',
              message: 'category_ids jest wymagane dla operacji assign_categories'
            } as ErrorResponseDTO),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
        result = await flashcardService.bulkAssignCategories(flashcard_ids, operationData.category_ids, user.id);
        break;
      
      case 'assign_groups':
        if (!operationData.group_ids || !Array.isArray(operationData.group_ids)) {
          return new Response(
            JSON.stringify({
              error: 'INVALID_REQUEST',
              message: 'group_ids jest wymagane dla operacji assign_groups'
            } as ErrorResponseDTO),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
        result = await flashcardService.bulkAssignGroups(flashcard_ids, operationData.group_ids, user.id);
        break;
      
      default:
        return new Response(
          JSON.stringify({
            error: 'INVALID_OPERATION',
            message: 'Nieobsługiwana operacja bulk'
          } as ErrorResponseDTO),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('POST /api/flashcards/bulk error:', error);

    // Handle service errors
    if (error && typeof error === 'object' && 'type' in error) {
      const errorResponse: ErrorResponseDTO = {
        error: error.type,
        message: error.message,
        details: error.details
      };

      return new Response(JSON.stringify(errorResponse), {
        status: error.statusCode || 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle unexpected errors
    const errorResponse: ErrorResponseDTO = {
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Wystąpił nieoczekiwany błąd podczas operacji bulk'
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 