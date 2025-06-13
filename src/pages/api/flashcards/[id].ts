import type { APIContext } from 'astro';
import { FlashcardService } from '../../../lib/services/flashcard.service';
import { validateUpdateFlashcardRequest, validateUUID } from '../../../lib/validation/flashcard.schemas';
import { isMockAuthEnabled, getMockUser, createMockSupabaseClient } from '../../../lib/auth/mock-auth';
import type { 
  UpdateFlashcardCommand, 
  ErrorResponseDTO,
  FlashcardDTO
} from '../../../types';

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/flashcards/{id}
 * Gets a single flashcard by ID for the authenticated user
 * Requires authentication (mock or real)
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // 1. Get authenticated user (mock or real)
    let supabase: any;
    let user: any;

    if (isMockAuthEnabled()) {
      console.log('🔧 Using mock authentication for GET single flashcard');
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

    // 2. Validate and extract flashcard ID from URL
    const flashcardId = context.params.id as string;
    if (!flashcardId) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'ID fiszki jest wymagane',
        400,
        { id: ['Brak ID fiszki w URL'] }
      );
    }

    // Validate UUID format
    validateUUID(flashcardId, 'flashcard_id');

    // 3. Execute business logic through service
    const flashcardService = new FlashcardService(supabase);
    const flashcard = await flashcardService.getById(flashcardId, user.id);

    // 4. Return success response
    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('GET /api/flashcards/{id} error:', error);
    return handleApiError(error);
  }
}

/**
 * PUT /api/flashcards/{id}
 * Updates an existing flashcard for the authenticated user
 * Requires authentication (mock or real)
 */
export async function PUT(context: APIContext): Promise<Response> {
  try {
    // 1. Get authenticated user (mock or real)
    let supabase: any;
    let user: any;

    if (isMockAuthEnabled()) {
      console.log('🔧 Using mock authentication for PUT flashcard');
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

    // 2. Validate and extract flashcard ID from URL
    const flashcardId = context.params.id as string;
    if (!flashcardId) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'ID fiszki jest wymagane',
        400,
        { id: ['Brak ID fiszki w URL'] }
      );
    }

    // Validate UUID format
    validateUUID(flashcardId, 'flashcard_id');

    // 3. Parse and validate request body
    const requestBody = await context.request.json().catch(() => null);
    if (!requestBody) {
      return createErrorResponse(
        'INVALID_REQUEST',
        'Treść żądania jest wymagana',
        400
      );
    }

    // 4. Validate input data using Zod schema
    const validatedData = await validateUpdateFlashcardRequest(requestBody);

    // 5. Create command for service layer
    const command: UpdateFlashcardCommand = {
      id: flashcardId,
      user_id: user.id,
      front: validatedData.front,
      back: validatedData.back,
      status: validatedData.status,
      category_ids: validatedData.category_ids,
      group_ids: validatedData.group_ids
    };

    // 6. Execute business logic through service
    const flashcardService = new FlashcardService(supabase);
    const updatedFlashcard = await flashcardService.updateFlashcard(command);

    // 7. Return success response
    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('PUT /api/flashcards/{id} error:', error);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/flashcards/{id}
 * Deletes a flashcard for the authenticated user
 * Requires authentication (mock or real)
 */
export async function DELETE(context: APIContext): Promise<Response> {
  try {
    // 1. Get authenticated user (mock or real)
    let supabase: any;
    let user: any;

    if (isMockAuthEnabled()) {
      console.log('🔧 Using mock authentication for DELETE flashcard');
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

    // 2. Validate and extract flashcard ID from URL
    const flashcardId = context.params.id as string;
    if (!flashcardId) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'ID fiszki jest wymagane',
        400,
        { id: ['Brak ID fiszki w URL'] }
      );
    }

    // Validate UUID format
    validateUUID(flashcardId, 'flashcard_id');

    // 3. Execute business logic through service
    const flashcardService = new FlashcardService(supabase);
    await flashcardService.deleteFlashcard(flashcardId, user.id);

    // 4. Return success response (204 No Content)
    return new Response(null, {
      status: 204,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('DELETE /api/flashcards/{id} error:', error);
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

  // Not found errors
  if (error.type === 'NOT_FOUND_ERROR') {
    return createErrorResponse(
      error.type,
      error.message,
      error.statusCode || 404,
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

  // Generic server error for unhandled cases
  console.error('Unhandled API error:', error);
  return createErrorResponse(
    'INTERNAL_SERVER_ERROR',
    'Wystąpił nieoczekiwany błąd serwera',
    500
  );
} 