/**
 * Base error class for OpenRouter service
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, OpenRouterError.prototype);
  }

  /**
   * Convert error to JSON format for API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

/**
 * Authentication error - invalid API key or unauthorized access
 */
export class AuthenticationError extends OpenRouterError {
  constructor(message = "Nieprawidłowy klucz API") {
    super(message, "AUTHENTICATION_ERROR", 401);
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Rate limit error - too many requests
 */
export class RateLimitError extends OpenRouterError {
  constructor(retryAfter?: number) {
    super("Przekroczono limit żądań", "RATE_LIMIT_ERROR", 429, { retryAfter });
    this.name = "RateLimitError";
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }

  get retryAfter(): number | undefined {
    return this.details?.retryAfter;
  }
}

/**
 * Validation error - invalid input data
 */
export class ValidationError extends OpenRouterError {
  constructor(message: string, field?: string) {
    super(message, "VALIDATION_ERROR", 400, { field });
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  get field(): string | undefined {
    return this.details?.field;
  }
}

/**
 * Model not available error - requested model is not accessible
 */
export class ModelNotAvailableError extends OpenRouterError {
  constructor(modelName: string) {
    super(`Model ${modelName} nie jest dostępny`, "MODEL_NOT_AVAILABLE", 400, { modelName });
    this.name = "ModelNotAvailableError";
    Object.setPrototypeOf(this, ModelNotAvailableError.prototype);
  }

  get modelName(): string {
    return this.details?.modelName;
  }
}

/**
 * Insufficient credits error - not enough credits to make the request
 */
export class InsufficientCreditsError extends OpenRouterError {
  constructor(required?: number, available?: number) {
    super("Niewystarczające środki na koncie", "INSUFFICIENT_CREDITS", 402, { required, available });
    this.name = "InsufficientCreditsError";
    Object.setPrototypeOf(this, InsufficientCreditsError.prototype);
  }
}

/**
 * Network error - connection issues
 */
export class NetworkError extends OpenRouterError {
  constructor(message = "Błąd połączenia") {
    super(message, "NETWORK_ERROR", 0);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Timeout error - request timed out
 */
export class TimeoutError extends OpenRouterError {
  constructor(timeout: number) {
    super(`Timeout żądania (${timeout}ms)`, "TIMEOUT_ERROR", 408, { timeout });
    this.name = "TimeoutError";
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * JSON parsing error - invalid JSON response
 */
export class JsonParsingError extends OpenRouterError {
  constructor(originalError: Error) {
    super("Błąd parsowania odpowiedzi JSON", "JSON_PARSING_ERROR", 500, { originalError: originalError.message });
    this.name = "JsonParsingError";
    Object.setPrototypeOf(this, JsonParsingError.prototype);
  }
}

/**
 * Schema validation error - response doesn't match expected schema
 */
export class SchemaValidationError extends OpenRouterError {
  constructor(message: string, expectedSchema?: unknown, receivedData?: unknown) {
    super(message, "SCHEMA_VALIDATION_ERROR", 422, { expectedSchema, receivedData });
    this.name = "SchemaValidationError";
    Object.setPrototypeOf(this, SchemaValidationError.prototype);
  }
}

/**
 * Content filter error - content was filtered by moderation
 */
export class ContentFilterError extends OpenRouterError {
  constructor(reason?: string) {
    super("Treść została odfiltrowana przez moderację", "CONTENT_FILTER_ERROR", 400, { reason });
    this.name = "ContentFilterError";
    Object.setPrototypeOf(this, ContentFilterError.prototype);
  }
}

/**
 * Server error - internal server error from OpenRouter
 */
export class ServerError extends OpenRouterError {
  constructor(message = "Wewnętrzny błąd serwera", statusCode = 500) {
    super(message, "SERVER_ERROR", statusCode);
    this.name = "ServerError";
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Service unavailable error - OpenRouter service is temporarily unavailable
 */
export class ServiceUnavailableError extends OpenRouterError {
  constructor(retryAfter?: number) {
    super("Usługa tymczasowo niedostępna", "SERVICE_UNAVAILABLE", 503, { retryAfter });
    this.name = "ServiceUnavailableError";
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/**
 * Type guard to check if error is an OpenRouter error
 */
export function isOpenRouterError(error: unknown): error is OpenRouterError {
  return error instanceof OpenRouterError;
}

/**
 * Type guard to check if error is a retryable error
 */
export function isRetryableError(error: unknown): boolean {
  if (!isOpenRouterError(error)) return false;

  const retryableCodes = ["RATE_LIMIT_ERROR", "TIMEOUT_ERROR", "NETWORK_ERROR", "SERVER_ERROR", "SERVICE_UNAVAILABLE"];

  return retryableCodes.includes(error.code);
}
