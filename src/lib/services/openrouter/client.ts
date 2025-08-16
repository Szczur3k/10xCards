import axios, { type AxiosInstance, AxiosError } from "axios";
import type {
  OpenRouterConfig,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  StructuredResponse,
  JsonSchema,
  ModelInfo,
  TokenUsage,
  FormattedMessage,
  ApiErrorResponse,
} from "./types";
import {
  OpenRouterError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  ModelNotAvailableError,
  InsufficientCreditsError,
  NetworkError,
  TimeoutError,
  JsonParsingError,
  SchemaValidationError,
  ContentFilterError,
  ServerError,
  ServiceUnavailableError,
  isRetryableError,
} from "./errors";
import { validateApiKey } from "./validators";

/**
 * OpenRouter Service - simplified implementation for communicating with OpenRouter API
 */
export class OpenRouterService {
  private client: AxiosInstance;
  private config: Required<Omit<OpenRouterConfig, "defaultModel">>;
  private systemMessage?: string;

  constructor(config: OpenRouterConfig) {
    // Validate required config
    if (!config.apiKey) {
      throw new ValidationError("API key jest wymagany", "apiKey");
    }

    // Use validator from validators.ts
    validateApiKey(config.apiKey);

    // Set default configuration
    this.config = {
      baseUrl: "https://openrouter.ai/api/v1",
      timeout: 30000,
      retryAttempts: 3,
      rateLimitPerMinute: 60,
      enableLogging: false,
      ...config,
    };

    // Initialize HTTP client
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: this.buildHeaders(),
    });

    if (this.config.enableLogging) {
      console.log("OpenRouter service initialized");
    }
  }

  // ==================== PUBLIC METHODS ====================

  /**
   * Send chat request to OpenRouter API
   */
  async chat(messages: ChatMessage[], options?: ChatOptions, model?: string): Promise<ChatResponse> {
    this.validateMessages(messages);

    if (!model) {
      throw new ValidationError("Model jest wymagany - nie można używać domyślnego modelu");
    }
    const selectedModel = model;

    const requestBody = {
      model: selectedModel,
      messages: this.formatMessages(messages),
      ...this.buildRequestOptions(options),
    };

    if (this.config.enableLogging) {
      console.log("Sending chat request", {
        model: selectedModel,
        messageCount: messages.length,
        requestBody: JSON.stringify(requestBody, null, 2),
        headers: this.buildHeaders(),
      });
    }

    try {
      const response = await this.makeRequest<ChatResponse>("/chat/completions", requestBody);

      if (this.config.enableLogging) {
        console.log("Chat request successful", {
          usage: response.usage,
          model: response.model,
        });
      }

      return response;
    } catch (error) {
      if (this.config.enableLogging) {
        console.error("Chat request failed", { error });
      }
      throw error;
    }
  }

  /**
   * Send chat request with structured JSON response
   */
  async chatWithSchema<T>(
    messages: ChatMessage[],
    schema: JsonSchema,
    options?: ChatOptions,
    model?: string
  ): Promise<StructuredResponse<T>> {
    this.validateMessages(messages);
    this.validateJsonSchema(schema);

    if (!model) {
      throw new ValidationError("Model jest wymagany dla structured responses");
    }
    const selectedModel = model;

    const requestBody = {
      model: selectedModel,
      messages: this.formatMessages(messages),
      response_format: {
        type: "json_schema" as const,
        json_schema: schema,
      },
      ...this.buildRequestOptions(options),
    };

    if (this.config.enableLogging) {
      console.log("Sending structured chat request", {
        model: selectedModel,
        schema: schema.name,
      });
    }

    try {
      const response = await this.makeRequest<ChatResponse>("/chat/completions", requestBody);
      const structuredData = this.parseStructuredResponse<T>(response, schema);

      if (this.config.enableLogging) {
        console.log("Structured chat request successful", {
          usage: response.usage,
          schema: schema.name,
        });
      }

      return {
        data: structuredData,
        usage: response.usage,
        model: response.model,
      };
    } catch (error) {
      if (this.config.enableLogging) {
        console.error("Structured chat request failed", { error, schema: schema.name });
      }
      throw error;
    }
  }

  /**
   * Get available models from OpenRouter
   */
  async getAvailableModels(): Promise<ModelInfo[]> {
    try {
      return await this.makeRequest<ModelInfo[]>("/models");
    } catch (error) {
      if (this.config.enableLogging) {
        console.error("Failed to get models", { error });
      }
      throw error;
    }
  }

  /**
   * Get information about specific model
   */
  async getModelInfo(modelName: string): Promise<ModelInfo> {
    const models = await this.getAvailableModels();
    const model = models.find((m) => m.id === modelName);

    if (!model) {
      throw new ModelNotAvailableError(modelName);
    }

    return model;
  }

  /**
   * Estimate token count for text (rough estimation)
   */
  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate cost for token usage
   */
  calculateCost(usage: TokenUsage, model: ModelInfo): number {
    const promptCost = (usage.prompt_tokens / 1000000) * model.pricing.prompt;
    const completionCost = (usage.completion_tokens / 1000000) * model.pricing.completion;

    return promptCost + completionCost;
  }

  // ==================== CONFIGURATION METHODS ====================

  /**
   * Set system message for subsequent requests
   */
  setSystemMessage(message: string): OpenRouterService {
    this.systemMessage = this.sanitizeContent(message);
    return this;
  }

  /**
   * Reset service to default state
   */
  reset(): OpenRouterService {
    this.systemMessage = undefined;
    return this;
  }

  // ==================== PRIVATE METHODS ====================

  private buildHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://10xcards.app",
      "X-Title": "10xCards",
    };
  }

  private async makeRequest<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.withRetry(async () => {
      try {
        const response = await this.client.post(endpoint, data);
        return response.data;
      } catch (error) {
        throw this.handleApiError(error as AxiosError);
      }
    });
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (!isRetryableError(error) || attempt === this.config.retryAttempts) {
          throw error;
        }

        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        if (this.config.enableLogging) {
          console.warn(`Request failed, retrying in ${delay}ms`, {
            attempt,
            error: lastError.message,
          });
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error("Unknown error occurred");
  }

  private handleApiError(error: AxiosError): never {
    if (error.response) {
      const { status, data } = error.response;
      const errorData = data as ApiErrorResponse;

      // Log full error details for debugging
      if (this.config.enableLogging) {
        console.error("OpenRouter API Error:", {
          status,
          statusText: error.response.statusText,
          data: errorData,
          headers: error.response.headers,
          requestUrl: error.config?.url,
          requestData: error.config?.data,
        });
      }

      switch (status) {
        case 401:
          throw new AuthenticationError(errorData.error?.message);
        case 402:
          throw new InsufficientCreditsError();
        case 403:
          if (errorData.error?.message?.includes("moderation") || errorData.error?.message?.includes("flagged")) {
            throw new ContentFilterError(errorData.error.message);
          }
          throw new OpenRouterError(
            errorData.error?.message || "Dostęp zabroniony - sprawdź uprawnienia lub treść wiadomości",
            "FORBIDDEN",
            403
          );
        case 429: {
          const retryAfter = parseInt(error.response.headers["retry-after"] || "60");
          throw new RateLimitError(retryAfter);
        }
        case 400:
          if (errorData.error?.message?.includes("content")) {
            throw new ContentFilterError(errorData.error.message);
          }
          throw new ValidationError(errorData.error?.message || "Nieprawidłowe żądanie");
        case 404:
          throw new OpenRouterError("Endpoint nie został znaleziony", "NOT_FOUND", 404);
        case 503: {
          const serviceRetryAfter = parseInt(error.response.headers["retry-after"] || "60");
          throw new ServiceUnavailableError(serviceRetryAfter);
        }
        default:
          if (status >= 500) {
            throw new ServerError(errorData.error?.message, status);
          }
          throw new OpenRouterError(errorData.error?.message || "Nieznany błąd API", "API_ERROR", status);
      }
    }

    if (error.code === "ECONNABORTED") {
      throw new TimeoutError(this.config.timeout);
    }

    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      throw new NetworkError("Nie można połączyć się z serwerem");
    }

    throw new NetworkError(error.message || "Błąd połączenia");
  }

  private validateMessages(messages: ChatMessage[]): void {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new ValidationError("Lista wiadomości nie może być pusta");
    }

    for (const message of messages) {
      if (!message.role || !["system", "user", "assistant"].includes(message.role)) {
        throw new ValidationError("Nieprawidłowa rola wiadomości");
      }

      if (!message.content || typeof message.content !== "string") {
        throw new ValidationError("Treść wiadomości jest wymagana");
      }

      if (message.content.length > 100000) {
        throw new ValidationError("Treść wiadomości jest zbyt długa (max 100,000 znaków)");
      }
    }
  }

  private validateJsonSchema(schema: JsonSchema): void {
    if (!schema.name || typeof schema.name !== "string") {
      throw new ValidationError("Nazwa schematu jest wymagana");
    }

    if (typeof schema.strict !== "boolean") {
      throw new ValidationError("Pole strict schematu musi być boolean");
    }

    if (!schema.schema || typeof schema.schema !== "object") {
      throw new ValidationError("Definicja schematu jest wymagana");
    }
  }

  private formatMessages(messages: ChatMessage[]): FormattedMessage[] {
    const formatted: FormattedMessage[] = [];

    // Add system message if set
    if (this.systemMessage) {
      formatted.push({
        role: "system",
        content: this.systemMessage,
      });
    }

    // Add user messages, sanitizing content
    for (const message of messages) {
      formatted.push({
        role: message.role,
        content: this.sanitizeContent(message.content),
        name: message.name,
      });
    }

    return formatted;
  }

  private sanitizeContent(content: string): string {
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .trim();
  }

  private buildRequestOptions(options?: ChatOptions): Record<string, unknown> {
    const requestOptions: Record<string, unknown> = {};

    if (options?.temperature !== undefined) requestOptions.temperature = options.temperature;
    if (options?.max_tokens !== undefined) requestOptions.max_tokens = options.max_tokens;
    if (options?.top_p !== undefined) requestOptions.top_p = options.top_p;
    if (options?.top_k !== undefined) requestOptions.top_k = options.top_k;
    if (options?.frequency_penalty !== undefined) requestOptions.frequency_penalty = options.frequency_penalty;
    if (options?.presence_penalty !== undefined) requestOptions.presence_penalty = options.presence_penalty;
    if (options?.repetition_penalty !== undefined) requestOptions.repetition_penalty = options.repetition_penalty;
    if (options?.stream !== undefined) requestOptions.stream = options.stream;
    if (options?.response_format !== undefined) requestOptions.response_format = options.response_format;

    return requestOptions;
  }

  private parseStructuredResponse<T>(response: ChatResponse): T {
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new SchemaValidationError("Brak treści w odpowiedzi");
    }

    try {
      const parsed = JSON.parse(content);
      return parsed as T;
    } catch (error) {
      throw new JsonParsingError(error as Error);
    }
  }
}
