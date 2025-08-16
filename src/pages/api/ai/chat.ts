import type { APIRoute } from "astro";
import { OpenRouterService } from "../../../lib/services/openrouter/client";
import {
  validateChatMessages,
  validateChatOptions,
  isValidationError,
} from "../../../lib/services/openrouter/validators";
import { isOpenRouterError } from "../../../lib/services/openrouter/errors";

// Configure prerendering
export const prerender = false;

// Initialize OpenRouter service instance
let openRouterService: OpenRouterService;

try {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error("OPENROUTER_API_KEY nie jest skonfigurowany w zmiennych środowiskowych");
    throw new Error("OPENROUTER_API_KEY nie jest skonfigurowany w zmiennych środowiskowych");
  }

  console.log("Initializing OpenRouter service with API key:", apiKey ? "Present" : "Missing");

  openRouterService = new OpenRouterService({
    apiKey,
    enableLogging: import.meta.env.DEV,
    timeout: 45000, // Longer timeout for AI requests
    retryAttempts: 2, // Conservative retry for production
  });

  console.log("OpenRouter service initialized successfully");
} catch (error) {
  console.error("Błąd inicjalizacji OpenRouter service:", error);
}

/**
 * POST /api/ai/chat - Send chat request to OpenRouter
 */
export const POST: APIRoute = async ({ request }) => {
  // CORS headers for development
  const corsHeaders = {
    "Access-Control-Allow-Origin": import.meta.env.DEV ? "*" : "same-origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  // Check if service is initialized
  if (!openRouterService) {
    console.error("OpenRouter service nie jest zainicjalizowany");
    return new Response(
      JSON.stringify({
        error: "Serwis AI nie jest dostępny",
        code: "SERVICE_UNAVAILABLE",
      }),
      {
        status: 503,
        headers: corsHeaders,
      }
    );
  }

  try {
    // Parse request body
    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane JSON",
          code: "INVALID_JSON",
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const { messages, options, schema, model } = requestData;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({
          error: 'Pole "messages" jest wymagane i musi być tablicą',
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Validate model field - required
    if (!model || typeof model !== "string") {
      return new Response(
        JSON.stringify({
          error: 'Pole "model" jest wymagane i musi być tekstem',
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Validate messages
    let validatedMessages;
    try {
      validatedMessages = validateChatMessages(messages);
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Błąd walidacji wiadomości",
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Validate options if provided
    let validatedOptions;
    if (options) {
      try {
        validatedOptions = validateChatOptions(options);
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Błąd walidacji opcji",
            code: "VALIDATION_ERROR",
          }),
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }
    }

    // Log request details in development
    if (import.meta.env.DEV) {
      console.log("AI Chat Request:", {
        messageCount: validatedMessages.length,
        hasOptions: !!validatedOptions,
        hasSchema: !!schema,
        model: model,
        timestamp: new Date().toISOString(),
      });
    }

    // Handle structured response with schema
    if (schema) {
      try {
        const response = await openRouterService.chatWithSchema(validatedMessages, schema, validatedOptions, model);

        return new Response(
          JSON.stringify({
            success: true,
            data: response.data,
            usage: response.usage,
            model: response.model,
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: corsHeaders,
          }
        );
      } catch (error) {
        console.error("Structured chat request failed:", error);

        if (isOpenRouterError(error)) {
          return new Response(
            JSON.stringify({
              error: error.message,
              code: error.code,
              details: error.details,
            }),
            {
              status: error.statusCode || 500,
              headers: corsHeaders,
            }
          );
        }

        throw error; // Re-throw unexpected errors
      }
    }

    // Handle regular chat request
    try {
      const response = await openRouterService.chat(validatedMessages, validatedOptions, model);

      // Extract the main response content
      const assistantMessage = response.choices[0]?.message?.content || "";

      return new Response(
        JSON.stringify({
          success: true,
          message: assistantMessage,
          usage: response.usage,
          model: response.model,
          finishReason: response.choices[0]?.finish_reason,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    } catch (error) {
      console.error("Chat request failed:", error);

      if (isOpenRouterError(error)) {
        return new Response(
          JSON.stringify({
            error: error.message,
            code: error.code,
            details: error.details,
          }),
          {
            status: error.statusCode || 500,
            headers: corsHeaders,
          }
        );
      }

      throw error; // Re-throw unexpected errors
    }
  } catch (error) {
    // Handle unexpected errors
    console.error("Unexpected error in AI chat endpoint:", error);

    const errorMessage = error instanceof Error ? error.message : "Nieznany błąd serwera";

    return new Response(
      JSON.stringify({
        error: "Wewnętrzny błąd serwera",
        code: "INTERNAL_SERVER_ERROR",
        details: import.meta.env.DEV ? errorMessage : undefined,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

/**
 * OPTIONS /api/ai/chat - Handle CORS preflight requests
 */
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": import.meta.env.DEV ? "*" : "same-origin",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
};
