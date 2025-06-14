import type { APIContext } from 'astro';
import { FlashcardService } from '../../../../lib/services/flashcard.service';
import { validateReviewFlashcardRequest, validateUUID } from '../../../../lib/validation/flashcard.schemas';
import { isMockAuthEnabled, getMockUser, createMockSupabaseClient } from '../../../../lib/auth/mock-auth';
import type { 
  ReviewFlashcardCommand, 
  ErrorResponseDTO,
  FlashcardDTO
} from '../../../../types';

// Disable prerendering for API routes
export const prerender = false;

/**
 * PUT /api/flashcards/{id}/review
 * Reviews an AI-generated flashcard (accept/reject/edit)
 * Converts GeneratedFlashcardDTO to FlashcardDTO on accept
 * 
 * @param context - Astro API context containing request data and params
 * @returns Response with FlashcardDTO or error
 */
export async function PUT(context: APIContext): Promise<Response> {
  try {
    // Step 1: Authentication - Get authenticated user (mock or real)
    let supabase: any;
    let user: any;

    if (isMockAuthEnabled()) {
      console.log('🔧 Using mock authentication for PUT /api/flashcards/{id}/review');
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

      // Extract and validate JWT token
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

    // Step 2: URL Parameter Validation - Extract and validate flashcard ID
    const flashcardId = context.params.id as string;
    if (!flashcardId) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'ID fiszki jest wymagane w URL',
        400,
        { id: ['Brak ID fiszki w parametrze URL'] }
      );
    }

    // Validate UUID format for flashcard ID
    try {
      validateUUID(flashcardId, 'flashcard_id');
    } catch (validationError: any) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Nieprawidłowy format ID fiszki',
        400,
        { id: ['ID fiszki musi być prawidłowym UUID'] }
      );
    }

    // Step 3: Request Body Validation - Parse and validate request body
    const requestBody = await context.request.json().catch(() => null);
    if (!requestBody) {
      return createErrorResponse(
        'INVALID_REQUEST',
        'Treść żądania jest wymagana dla operacji review',
        400,
        { body: ['Request body nie może być pusty'] }
      );
    }

    // Validate request body structure using Zod schema
    let validatedData;
    try {
      validatedData = await validateReviewFlashcardRequest(requestBody);
    } catch (validationError: any) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Nieprawidłowe dane w żądaniu review',
        400,
        validationError.details || { validation: ['Błąd walidacji danych wejściowych'] }
      );
    }

    // Step 4: Business Logic - Create command for service layer
    const command: ReviewFlashcardCommand = {
      flashcardId: flashcardId,
      userId: user.id,
      action: validatedData.action,
      front: validatedData.front,
      back: validatedData.back,
      status: validatedData.status
    };

    // Step 5: Service Layer Execution - Execute review logic through service
    const flashcardService = new FlashcardService(supabase);
    const reviewedFlashcard = await flashcardService.reviewFlashcard(command);

    // Step 6: Success Response - Return converted FlashcardDTO
    return new Response(JSON.stringify(reviewedFlashcard), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('PUT /api/flashcards/{id}/review error:', error);
    return handleApiError(error);
  }
}

/**
 * Creates standardized error response following project patterns
 * 
 * @param errorType - Type of error for categorization
 * @param message - Human-readable error message in Polish
 * @param statusCode - HTTP status code
 * @param details - Optional field-specific error details
 * @returns Formatted error response
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
 * Follows the error handling patterns established in other endpoints
 * 
 * @param error - Error object from service layer or validation
 * @returns Appropriate error response
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

  // Database errors from service layer
  if (error.type === 'DATABASE_ERROR') {
    return createErrorResponse(
      error.type,
      error.message,
      error.statusCode || 500,
      error.details
    );
  }

  // Not found errors (flashcard doesn't exist or doesn't belong to user)
  if (error.type === 'NOT_FOUND_ERROR') {
    return createErrorResponse(
      error.type,
      error.message,
      error.statusCode || 404,
      error.details
    );
  }

  // Authorization errors (insufficient permissions)
  if (error.type === 'AUTHORIZATION_ERROR') {
    return createErrorResponse(
      error.type,
      error.message,
      403,
      error.details
    );
  }

  // Supabase JWT token errors
  if (error.message?.includes('JWT')) {
    return createErrorResponse(
      'INVALID_TOKEN',
      'Token autoryzacji jest nieprawidłowy lub wygasł',
      401
    );
  }

  // Generic server errors - log details but return generic message
  console.error('Unhandled API error in review endpoint:', error);
  return createErrorResponse(
    'INTERNAL_SERVER_ERROR',
    'Wystąpił nieoczekiwany błąd serwera podczas przetwarzania review',
    500
  );
} 