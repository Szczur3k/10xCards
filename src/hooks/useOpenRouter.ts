import { useState } from "react";
import type { ChatMessage, ChatOptions, JsonSchema } from "../lib/services/openrouter/types";

interface OpenRouterResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
  finishReason?: string;
  timestamp?: string;
}

interface OpenRouterError {
  error: string;
  code: string;
  details?: unknown;
}

export function useOpenRouter() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chat = async (messages: ChatMessage[], model: string, options?: ChatOptions): Promise<OpenRouterResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          model,
          options,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as OpenRouterError;
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return data as OpenRouterResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const chatWithSchema = async <T>(
    messages: ChatMessage[],
    model: string,
    schema: JsonSchema,
    options?: ChatOptions
  ): Promise<{ data: T; usage: unknown; model: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          model,
          schema,
          options,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorData = responseData as OpenRouterError;
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return {
        data: responseData.data as T,
        usage: responseData.usage,
        model: responseData.model,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    chat,
    chatWithSchema,
    isLoading,
    error,
    clearError,
  };
}
