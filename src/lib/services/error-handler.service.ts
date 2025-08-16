import { isOpenRouterError, type OpenRouterError } from "./openrouter/errors";
import type { ErrorResponseDTO } from "../../types";

/**
 * Universal error handler service for API responses
 * Converts various error types to user-friendly messages
 */
export class ErrorHandlerService {
  /**
   * Parse error from API response and return user-friendly message
   */
  static async parseApiError(response: Response): Promise<string> {
    try {
      const errorData: ErrorResponseDTO = await response.json();

      // Return the message from structured error response
      if (errorData.message) {
        return errorData.message;
      }

      // Fallback to error code if no message
      if (errorData.error) {
        return this.getErrorMessage(errorData.error);
      }
    } catch (parseError) {
      // If JSON parsing fails, use HTTP status
      console.warn("Failed to parse error response:", parseError);
    }

    // Fallback to HTTP status message
    return this.getHttpStatusMessage(response.status, response.statusText);
  }

  /**
   * Convert error code to user-friendly message
   */
  static getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      // Authentication & Authorization
      UNAUTHORIZED: "Brak autoryzacji. Zaloguj się ponownie.",
      AUTHENTICATION_ERROR: "Nieprawidłowy klucz API",
      FORBIDDEN: "Brak uprawnień do wykonania tej operacji",

      // Rate Limiting & Credits
      RATE_LIMIT_ERROR: "Przekroczono limit żądań. Spróbuj ponownie za chwilę.",
      INSUFFICIENT_CREDITS: "Niewystarczające środki na koncie",

      // Validation
      VALIDATION_ERROR: "Nieprawidłowe dane wejściowe",
      INVALID_JSON: "Nieprawidłowy format danych",
      MISSING_REQUIRED_FIELDS: "Brak wymaganych pól",

      // AI & Models
      MODEL_NOT_AVAILABLE: "Wybrany model AI nie jest dostępny",
      AI_GENERATION_ERROR: "Błąd podczas generowania przez AI",
      AI_PARSING_ERROR: "Błąd parsowania odpowiedzi AI",
      CONTENT_FILTER_ERROR: "Treść została odfiltrowana przez moderację",

      // Network & Server
      NETWORK_ERROR: "Błąd połączenia z serwerem",
      TIMEOUT_ERROR: "Przekroczono czas oczekiwania na odpowiedź",
      SERVER_ERROR: "Wewnętrzny błąd serwera",
      SERVICE_UNAVAILABLE: "Usługa tymczasowo niedostępna",

      // Database
      DATABASE_ERROR: "Błąd bazy danych",
      NOT_FOUND_ERROR: "Zasób nie został znaleziony",

      // Generic
      INTERNAL_SERVER_ERROR: "Wystąpił nieoczekiwany błąd serwera",
      METHOD_NOT_ALLOWED: "Metoda HTTP nie jest obsługiwana",
    };

    return errorMessages[errorCode] || `Nieznany błąd: ${errorCode}`;
  }

  /**
   * Convert HTTP status to user-friendly message
   */
  static getHttpStatusMessage(status: number, statusText: string): string {
    const statusMessages: Record<number, string> = {
      400: "Nieprawidłowe żądanie",
      401: "Brak autoryzacji",
      402: "Niewystarczające środki",
      403: "Brak uprawnień",
      404: "Nie znaleziono",
      405: "Metoda nie obsługiwana",
      408: "Przekroczono czas oczekiwania",
      409: "Konflikt danych",
      422: "Nieprawidłowe dane",
      429: "Zbyt wiele żądań",
      500: "Błąd serwera",
      502: "Błąd bramy",
      503: "Usługa niedostępna",
      504: "Przekroczono czas oczekiwania bramy",
    };

    return statusMessages[status] || `HTTP ${status}: ${statusText}`;
  }

  /**
   * Handle OpenRouter specific errors
   */
  static handleOpenRouterError(error: OpenRouterError): string {
    // OpenRouter errors already have user-friendly Polish messages
    return error.message;
  }

  /**
   * Universal error handler for any error type
   */
  static handleError(error: unknown): string {
    // Handle OpenRouter errors
    if (isOpenRouterError(error)) {
      return this.handleOpenRouterError(error);
    }

    // Handle standard Error objects
    if (error instanceof Error) {
      return error.message;
    }

    // Handle string errors
    if (typeof error === "string") {
      return error;
    }

    // Handle structured error objects
    if (error && typeof error === "object") {
      const errorObj = error as any;

      if (errorObj.message) {
        return errorObj.message;
      }

      if (errorObj.error) {
        return this.getErrorMessage(errorObj.error);
      }
    }

    // Fallback for unknown error types
    return "Wystąpił nieoczekiwany błąd";
  }
}
