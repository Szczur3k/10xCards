import type { APIContext } from "astro";
import { CategoryService } from "../../lib/services/category.service";
import { createCategoryRequestSchema } from "../../lib/validation/category.schemas";
import type { CreateCategoryCommand, ErrorResponseDTO, CategoryDTO, CategoryListResponseDTO } from "../../types";

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/categories
 * Returns all categories for the authenticated user
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // Auth validation from middleware
    const { user, isAuthenticated, supabase } = context.locals;

    if (!isAuthenticated || !user) {
      return new Response(
        JSON.stringify({
          error: "UNAUTHORIZED",
          message: "Wymagane jest zalogowanie",
        } as ErrorResponseDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize service and get categories
    const categoryService = new CategoryService(supabase);
    const result: CategoryListResponseDTO = await categoryService.getCategories(user.id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("GET /api/categories error:", error);

    // Handle service errors
    if (error && typeof error === "object" && "type" in error) {
      const errorResponse: ErrorResponseDTO = {
        error: error.type,
        message: error.message,
        details: error.details,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: error.statusCode || 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    const errorResponse: ErrorResponseDTO = {
      error: "INTERNAL_SERVER_ERROR",
      message: "Wystąpił nieoczekiwany błąd serwera",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * POST /api/categories
 * Creates a new category for the authenticated user
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    // Auth validation from middleware
    const { user, isAuthenticated, supabase } = context.locals;

    if (!isAuthenticated || !user) {
      return new Response(
        JSON.stringify({
          error: "UNAUTHORIZED",
          message: "Wymagane jest zalogowanie",
        } as ErrorResponseDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
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
          error: "INVALID_JSON",
          message: "Nieprawidłowy format JSON w żądaniu",
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate request data
    let validatedData;
    try {
      validatedData = createCategoryRequestSchema.parse(requestData);
    } catch (error: any) {
      const errorResponse: ErrorResponseDTO = {
        error: "VALIDATION_ERROR",
        message: "Nieprawidłowe dane wejściowe",
        details: error.errors
          ? error.errors.reduce((acc: any, err: any) => {
              const field = err.path.join(".");
              if (!acc[field]) acc[field] = [];
              acc[field].push(err.message);
              return acc;
            }, {})
          : {},
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create category command
    const createCommand: CreateCategoryCommand = {
      name: validatedData.name,
      description: validatedData.description,
    };

    // Initialize service and create category
    const categoryService = new CategoryService(supabase);
    const result: CategoryDTO = await categoryService.createCategory(createCommand, user.id);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("POST /api/categories error:", error);

    // Handle validation errors
    if (error && typeof error === "object" && "type" in error) {
      const errorResponse: ErrorResponseDTO = {
        error: error.type,
        message: error.message,
        details: error.details,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: error.statusCode || 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    const errorResponse: ErrorResponseDTO = {
      error: "INTERNAL_SERVER_ERROR",
      message: "Wystąpił nieoczekiwany błąd serwera",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
