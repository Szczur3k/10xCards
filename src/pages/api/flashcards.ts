import type { APIContext } from 'astro';
import { FlashcardService } from '../../lib/services/flashcard.service';
import { validateCreateFlashcardRequest, validateGetFlashcardsQuery } from '../../lib/validation/flashcard.schemas';
import { isMockAuthEnabled, getMockUser, createMockSupabaseClient } from '../../lib/auth/mock-auth';
import type { 
  CreateFlashcardCommand, 
  ErrorResponseDTO,
  FlashcardDTO,
  FlashcardQueryParams,
  FlashcardListResponseDTO
} from '../../types';

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/flashcards
 * Gets user's flashcards with filtering, sorting and pagination
 * Requires JWT authentication
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // 1. Get authenticated user (mock or real)
    let supabase: any;
    let user: any;

    if (isMockAuthEnabled()) {
      // Mock authentication for development
      console.log('🔧 Using mock authentication for GET');
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

    // 2. Parse and validate query parameters
    const queryParams = await validateGetFlashcardsQuery(context.url.searchParams);

    // 3. Execute business logic through service
    const flashcardService = new FlashcardService(supabase);
    const result = await flashcardService.getFlashcards(user.id, queryParams);

    // 4. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('GET /api/flashcards error:', error);
    return handleApiError(error);
  }
}

/**
 * POST /api/flashcards
 * Creates a new flashcard manually
 * Requires JWT authentication
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    // 1. Get authenticated user (mock or real)
    let supabase: any;
    let user: any;

    if (isMockAuthEnabled()) {
      // Mock authentication for development
      console.log('🔧 Using mock authentication');
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
        'Treść żądania jest wymagana',
        400
      );
    }

    // 3. Validate input data using Zod schema
    const validatedData = await validateCreateFlashcardRequest(requestBody);

    // 4. Create command for service layer
    const command: CreateFlashcardCommand = {
      front: validatedData.front,
      back: validatedData.back,
      creation_type: 'manual',
      status: validatedData.status || 'draft',
      user_id: user.id,
      source_text_id: undefined,
      category_ids: validatedData.category_ids,
      group_ids: validatedData.group_ids
    };

    // 5. Execute business logic through service
    const flashcardService = new FlashcardService(supabase);
    const createdFlashcard = await flashcardService.createFlashcard(command);

    // 6. Return success response
    return new Response(JSON.stringify(createdFlashcard), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('POST /api/flashcards error:', error);
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

  // Not found errors (categories/groups)
  if (error.type === 'NOT_FOUND_ERROR') {
    return createErrorResponse(
      error.type,
      error.message,
      error.statusCode || 404,
      error.details
    );
  }

  // Authorization errors
  if (error.type === 'AUTHORIZATION_ERROR') {
    return createErrorResponse(
      error.type,
      error.message,
      401,
      error.details
    );
  }

  // Supabase auth errors
  if (error.message?.includes('JWT')) {
    return createErrorResponse(
      'INVALID_TOKEN',
      'Token autoryzacji jest nieprawidłowy lub wygasł',
      401
    );
  }

  // Generic server errors
  console.error('Unhandled API error:', error);
  return createErrorResponse(
    'INTERNAL_SERVER_ERROR',
    'Wystąpił nieoczekiwany błąd serwera',
    500
  );
} 