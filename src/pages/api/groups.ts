import type { APIContext } from 'astro';
import { GroupService } from '../../lib/services/group.service';
import { createGroupRequestSchema } from '../../lib/validation/group.schemas';
import type { 
  CreateGroupCommand, 
  ErrorResponseDTO,
  GroupDTO,
  GroupListResponseDTO
} from '../../types';

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/groups
 * Returns all groups for the authenticated user
 */
export async function GET(context: APIContext): Promise<Response> {
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

    // Initialize service and get groups
    const groupService = new GroupService(supabase);
    const result: GroupListResponseDTO = await groupService.getGroups(user.id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('GET /api/groups error:', error);

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
      message: 'Wystąpił nieoczekiwany błąd serwera'
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * POST /api/groups
 * Creates a new group for the authenticated user
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

    // Validate request data
    let validatedData;
    try {
      validatedData = createGroupRequestSchema.parse(requestData);
    } catch (error: any) {
      const errorResponse: ErrorResponseDTO = {
        error: 'VALIDATION_ERROR',
        message: 'Nieprawidłowe dane wejściowe',
        details: error.errors ? error.errors.reduce((acc: any, err: any) => {
          const field = err.path.join('.');
          if (!acc[field]) acc[field] = [];
          acc[field].push(err.message);
          return acc;
        }, {}) : {}
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create group command
    const createCommand: CreateGroupCommand = {
      name: validatedData.name,
      description: validatedData.description
    };

    // Initialize service and create group
    const groupService = new GroupService(supabase);
    const result: GroupDTO = await groupService.createGroup(createCommand, user.id);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('POST /api/groups error:', error);

    // Handle validation errors
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
      message: 'Wystąpił nieoczekiwany błąd serwera'
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 