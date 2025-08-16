export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string;
}

export interface ChatOptions {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  repetition_penalty?: number;
  stream?: boolean;
  response_format?: ResponseFormat;
}

export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, any>;
  };
}

export interface JsonSchema {
  name: string;
  strict: boolean;
  schema: Record<string, any>;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StructuredResponse<T> {
  data: T;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export interface ChatChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }>;
}

export interface ModelInfo {
  id: string;
  name: string;
  context_length: number;
  pricing: {
    prompt: number;
    completion: number;
  };
  top_provider: {
    max_completion_tokens?: number;
    is_moderated: boolean;
  };
  per_request_limits?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ModelParameters {
  temperature?: number; // 0.0 - 2.0
  max_tokens?: number; // 1 - model_max
  top_p?: number; // 0.0 - 1.0
  top_k?: number; // 1 - 40
  frequency_penalty?: number; // -2.0 - 2.0
  presence_penalty?: number; // -2.0 - 2.0
  repetition_penalty?: number; // 0.1 - 2.0
}

export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  rateLimitPerMinute?: number;
  enableLogging?: boolean;
}

export interface FormattedMessage {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}
