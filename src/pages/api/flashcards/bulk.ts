import type { APIContext } from 'astro';
import { FlashcardService } from '../../../lib/services/flashcard.service';
import { validateBulkDeleteRequest, validateBulkOperationRequest } from '../../../lib/validation/bulk.schemas';
import { isMockAuthEnabled, getMockUser, createMockSupabaseClient } from '../../../lib/auth/mock-auth';
import type { ErrorResponseDTO } from '../../../types';

// Disable prerendering for API routes
export const prerender = false;

/**
 * DELETE /api/flashcards/bulk
 * Bulk delete multiple flashcards at once
 * Requires JWT authentication
 */
export async function DELETE(context: APIContext): Promise<Response> {
  try {
    // 1. Get authenticated user (mock or real)
    let supabase: any;
    let user: any;

    if (isMockAuthEnabled()) {
      // Mock authentication for development
      console.log('🔧 Using mock authentication for bulk DELETE');
      supabase = createMockSupabaseClient();
      user = getMockUser();
    } else {
      // Real Supabase authentication
      supabase = context.locals.supabase;
      if (!supabase) {
        return createErrorResponse(
          'AUTHORIZATION_ERROR',
          'Supabase client not available',
          401
        );
      }

      // Get user from JWT token
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        return createErrorResponse(
          'UNAUTHORIZED',
          'Token autoryzacji jest wymagany lub nieprawidłowy',
          401
        );
      }
      
      user = authUser;
    }

    // 2. Parse and validate request body
    const requestBody = await context.request.json().catch(() => null);
    if (!requestBody) {
      return createErrorResponse(
        'INVALID_REQUEST',
        'Treść żądania jest wymagana dla operacji masowego usuwania',
        400
      );
    }

    // Debug logging
    console.log('🔍 DELETE bulk request body:', JSON.stringify(requestBody, null, 2));

    // 3. Validate input data using Zod schema
    const validatedData = await validateBulkDeleteRequest(requestBody);

    // 4. Execute business logic through service
    const flashcardService = new FlashcardService(supabase);
    const results = await flashcardService.bulkDeleteFlashcards(
      validatedData.flashcard_ids, 
      user.id
    );

    // 5. Return success response
    return new Response(JSON.stringify({
      success: true,
      message: `Pomyślnie usunięto ${results.processed_count} fiszek`,
      processed_count: results.processed_count,
      failed_count: results.failed_count,
      errors: results.errors
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('DELETE /api/flashcards/bulk error:', error);
    return handleApiError(error);
  }
}

/**
 * PUT /api/flashcards/bulk
 * Bulk operations on multiple flashcards (change status, assign categories/groups)
 * Requires JWT authentication
 */
export async function PUT(context: APIContext): Promise<Response> {
  try {
    // 1. Get authenticated user (mock or real)
    let supabase: any;
    let user: any;

    if (isMockAuthEnabled()) {
      // Mock authentication for development
      console.log('🔧 Using mock authentication for bulk PUT');
      supabase = createMockSupabaseClient();
      user = getMockUser();
    } else {
      // Real Supabase authentication
      supabase = context.locals.supabase;
      if (!supabase) {
        return createErrorResponse(
          'AUTHORIZATION_ERROR',
          'Supabase client not available',
          401
        );
      }

      // Get user from JWT token
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        return createErrorResponse(
          'UNAUTHORIZED',
          'Token autoryzacji jest wymagany lub nieprawidłowy',
          401
        );
      }
      
      user = authUser;
    }

    // 2. Parse and validate request body
    const requestBody = await context.request.json().catch(() => null);
    if (!requestBody) {
      return createErrorResponse(
        'INVALID_REQUEST',
        'Treść żądania jest wymagana dla operacji masowej',
        400
      );
    }

    // Debug logging
    console.log('🔍 PUT bulk request body:', JSON.stringify(requestBody, null, 2));

    // 3. Validate input data using Zod schema
    const validatedData = await validateBulkOperationRequest(requestBody);

    // 4. Execute appropriate bulk operation through service
    const flashcardService = new FlashcardService(supabase);
    let results;
    let operationMessage = '';

    switch (validatedData.operation) {
      case 'change_status':
        if (!validatedData.data?.status) {
          return createErrorResponse(
            'INVALID_REQUEST',
            'Status jest wymagany dla operacji zmiany statusu',
            400
          );
        }
        results = await flashcardService.bulkChangeStatus(
          validatedData.flashcard_ids,
          validatedData.data.status,
          user.id
        );
        operationMessage = `Pomyślnie zmieniono status ${results.processed_count} fiszek`;
        break;

      case 'assign_categories':
        if (!validatedData.data?.category_ids || validatedData.data.category_ids.length === 0) {
          return createErrorResponse(
            'INVALID_REQUEST',
            'Kategorie są wymagane dla operacji przypisywania kategorii',
            400
          );
        }
        results = await flashcardService.bulkAssignCategories(
          validatedData.flashcard_ids,
          validatedData.data.category_ids,
          user.id
        );
        operationMessage = `Pomyślnie przypisano kategorie do ${results.processed_count} fiszek`;
        break;

      case 'assign_groups':
        if (!validatedData.data?.group_ids || validatedData.data.group_ids.length === 0) {
          return createErrorResponse(
            'INVALID_REQUEST',
            'Grupy są wymagane dla operacji przypisywania grup',
            400
          );
        }
        results = await flashcardService.bulkAssignGroups(
          validatedData.flashcard_ids,
          validatedData.data.group_ids,
          user.id
        );
        operationMessage = `Pomyślnie przypisano grupy do ${results.processed_count} fiszek`;
        break;

      default:
        return createErrorResponse(
          'INVALID_REQUEST',
          `Nieznana operacja masowa: ${validatedData.operation}`,
          400
        );
    }

    // 5. Return success response
    return new Response(JSON.stringify({
      success: true,
      message: operationMessage,
      operation: validatedData.operation,
      processed_count: results.processed_count,
      failed_count: results.failed_count,
      errors: results.errors
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('PUT /api/flashcards/bulk error:', error);
    return handleApiError(error);
  }
}

/**
 * POST /api/flashcards/bulk (for compatibility)
 * Legacy support - routes to appropriate method based on operation type
 * Requires JWT authentication
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    // Parse request body to determine operation type
    const requestBody = await context.request.json().catch(() => null);
    if (!requestBody) {
      return createErrorResponse(
        'INVALID_REQUEST',
        'Treść żądania jest wymagana',
        400
      );
    }

    // Route to appropriate method based on operation
    if (requestBody.operation === 'delete' || (requestBody.flashcard_ids && !requestBody.operation)) {
      // Handle as DELETE operation
      const deleteRequest = new Request(context.request.url, {
        method: 'DELETE',
        headers: context.request.headers,
        body: JSON.stringify({ flashcard_ids: requestBody.flashcard_ids })
      });
      
      const deleteContext = { ...context, request: deleteRequest };
      return await DELETE(deleteContext);
    } else {
      // Handle as PUT operation
      const putRequest = new Request(context.request.url, {
        method: 'PUT',
        headers: context.request.headers,
        body: JSON.stringify(requestBody)
      });
      
      const putContext = { ...context, request: putRequest };
      return await PUT(putContext);
    }

  } catch (error: any) {
    console.error('POST /api/flashcards/bulk error:', error);
    return handleApiError(error);
  }
}

/**
 * Creates standardized error response
 */
function createErrorResponse(
  errorType: string, 
  message: string, 
  statusCode: number,
  details?: Record<string, string[]>
): Response {
  const errorResponse: ErrorResponseDTO = {
    error: errorType,
    message,
    details
  };

  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}

/**
 * Handles different types of API errors with appropriate HTTP status codes
 */
function handleApiError(error: any): Response {
  // Validation errors from Zod schema
  if (error.type === 'VALIDATION_ERROR') {
    return createErrorResponse(
      error.type,
      error.message,
      error.statusCode || 400,
      error.details
    );
  }

  // Database errors
  if (error.type === 'DATABASE_ERROR') {
    return createErrorResponse(
      error.type,
      error.message,
      error.statusCode || 500,
      error.details
    );
  }

  // Not found errors
  if (error.type === 'NOT_FOUND_ERROR') {
    return createErrorResponse(
      error.type,
      error.message,
      error.statusCode || 404,
      error.details
    );
  }

  // Authentication/Authorization errors
  if (error.type === 'UNAUTHORIZED' || error.type === 'AUTHORIZATION_ERROR') {
    return createErrorResponse(
      error.type,
      error.message,
      error.statusCode || 401,
      error.details
    );
  }

  // Generic server errors
  console.error('Unhandled bulk operations error:', error);
  return createErrorResponse(
    'INTERNAL_SERVER_ERROR',
    'Wystąpił nieoczekiwany błąd podczas operacji masowej',
    500
  );
} 