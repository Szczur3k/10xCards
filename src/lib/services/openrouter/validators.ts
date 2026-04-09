import { z } from "zod";
import type { ChatMessage, ChatOptions, ModelParameters, JsonSchema } from "./types";

/**
 * Schema for validating chat messages
 */
export const ChatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"], {
    errorMap: () => ({ message: "Rola musi być jedną z: system, user, assistant" }),
  }),
  content: z
    .string({
      required_error: "Treść wiadomości jest wymagana",
      invalid_type_error: "Treść wiadomości musi być tekstem",
    })
    .min(1, "Treść wiadomości nie może być pusta")
    .max(100000, "Treść wiadomości jest zbyt długa (max 100,000 znaków)"),
  name: z
    .string()
    .min(1, "Nazwa nie może być pusta")
    .max(64, "Nazwa jest zbyt długa (max 64 znaki)")
    .regex(/^[a-zA-Z0-9_-]+$/, "Nazwa może zawierać tylko litery, cyfry, _ i -")
    .optional(),
});

/**
 * Schema for validating multiple chat messages
 */
export const ChatMessagesSchema = z
  .array(ChatMessageSchema)
  .min(1, "Lista wiadomości nie może być pusta")
  .max(100, "Zbyt wiele wiadomości (max 100)")
  .refine(
    (messages) => {
      // Check if there are not too many consecutive system messages
      let consecutiveSystemMessages = 0;
      for (const message of messages) {
        if (message.role === "system") {
          consecutiveSystemMessages++;
          if (consecutiveSystemMessages > 3) return false;
        } else {
          consecutiveSystemMessages = 0;
        }
      }
      return true;
    },
    {
      message: "Zbyt wiele kolejnych wiadomości systemowych (max 3)",
    }
  );

/**
 * Schema for validating chat options
 */
export const ChatOptionsSchema = z
  .object({
    temperature: z
      .number({
        invalid_type_error: "Temperature musi być liczbą",
      })
      .min(0, "Temperature nie może być mniejsza niż 0")
      .max(2, "Temperature nie może być większa niż 2")
      .optional(),

    max_tokens: z
      .number({
        invalid_type_error: "Max tokens musi być liczbą",
      })
      .int("Max tokens musi być liczbą całkowitą")
      .min(1, "Max tokens musi być większe niż 0")
      .max(200000, "Max tokens nie może przekraczać 200,000")
      .optional(),

    top_p: z
      .number({
        invalid_type_error: "Top_p musi być liczbą",
      })
      .min(0, "Top_p nie może być mniejsze niż 0")
      .max(1, "Top_p nie może być większe niż 1")
      .optional(),

    top_k: z
      .number({
        invalid_type_error: "Top_k musi być liczbą",
      })
      .int("Top_k musi być liczbą całkowitą")
      .min(1, "Top_k musi być większe niż 0")
      .max(40, "Top_k nie może być większe niż 40")
      .optional(),

    frequency_penalty: z
      .number({
        invalid_type_error: "Frequency penalty musi być liczbą",
      })
      .min(-2, "Frequency penalty nie może być mniejsze niż -2")
      .max(2, "Frequency penalty nie może być większe niż 2")
      .optional(),

    presence_penalty: z
      .number({
        invalid_type_error: "Presence penalty musi być liczbą",
      })
      .min(-2, "Presence penalty nie może być mniejsze niż -2")
      .max(2, "Presence penalty nie może być większe niż 2")
      .optional(),

    repetition_penalty: z
      .number({
        invalid_type_error: "Repetition penalty musi być liczbą",
      })
      .min(0.1, "Repetition penalty nie może być mniejsze niż 0.1")
      .max(2, "Repetition penalty nie może być większe niż 2")
      .optional(),

    stream: z
      .boolean({
        invalid_type_error: "Stream musi być wartością boolean",
      })
      .optional(),

    response_format: z
      .object({
        type: z.literal("json_schema", {
          errorMap: () => ({ message: 'Typ response_format musi być "json_schema"' }),
        }),
        json_schema: z.object({
          name: z
            .string({
              required_error: "Nazwa schematu jest wymagana",
            })
            .min(1, "Nazwa schematu nie może być pusta")
            .max(64, "Nazwa schematu jest zbyt długa (max 64 znaki)")
            .regex(
              /^[a-zA-Z][a-zA-Z0-9_]*$/,
              "Nazwa schematu musi zaczynać się od litery i zawierać tylko litery, cyfry i _"
            ),
          strict: z.boolean({
            required_error: "Pole strict jest wymagane",
            invalid_type_error: "Pole strict musi być wartością boolean",
          }),
          schema: z
            .record(z.any(), {
              required_error: "Definicja schematu jest wymagana",
            })
            .refine(
              (schema) => {
                // Basic JSON Schema validation
                return typeof schema === "object" && schema !== null;
              },
              {
                message: "Schema musi być prawidłowym obiektem JSON Schema",
              }
            ),
        }),
      })
      .optional(),
  })
  .strict();

/**
 * Schema for validating model parameters
 */
export const ModelParametersSchema = z
  .object({
    temperature: z
      .number()
      .min(0, "Temperature nie może być mniejsza niż 0")
      .max(2, "Temperature nie może być większa niż 2")
      .optional(),

    max_tokens: z
      .number()
      .int("Max tokens musi być liczbą całkowitą")
      .min(1, "Max tokens musi być większe niż 0")
      .max(200000, "Max tokens nie może przekraczać 200,000")
      .optional(),

    top_p: z.number().min(0, "Top_p nie może być mniejsze niż 0").max(1, "Top_p nie może być większe niż 1").optional(),

    top_k: z
      .number()
      .int("Top_k musi być liczbą całkowitą")
      .min(1, "Top_k musi być większe niż 0")
      .max(40, "Top_k nie może być większe niż 40")
      .optional(),

    frequency_penalty: z
      .number()
      .min(-2, "Frequency penalty nie może być mniejsze niż -2")
      .max(2, "Frequency penalty nie może być większe niż 2")
      .optional(),

    presence_penalty: z
      .number()
      .min(-2, "Presence penalty nie może być mniejsze niż -2")
      .max(2, "Presence penalty nie może być większe niż 2")
      .optional(),

    repetition_penalty: z
      .number()
      .min(0.1, "Repetition penalty nie może być mniejsze niż 0.1")
      .max(2, "Repetition penalty nie może być większe niż 2")
      .optional(),
  })
  .strict();

/**
 * Schema for validating JSON Schema structure
 */
export const JsonSchemaSchema = z
  .object({
    name: z
      .string({
        required_error: "Nazwa schematu jest wymagana",
      })
      .min(1, "Nazwa schematu nie może być pusta")
      .max(64, "Nazwa schematu jest zbyt długa (max 64 znaki)")
      .regex(
        /^[a-zA-Z][a-zA-Z0-9_]*$/,
        "Nazwa schematu musi zaczynać się od litery i zawierać tylko litery, cyfry i _"
      ),

    strict: z.boolean({
      required_error: "Pole strict jest wymagane",
      invalid_type_error: "Pole strict musi być wartością boolean",
    }),

    schema: z
      .record(z.any(), {
        required_error: "Definicja schematu jest wymagana",
      })
      .refine(
        (schema) => {
          // Validate basic JSON Schema structure
          if (typeof schema !== "object" || schema === null) return false;

          // Must have type property
          if (!schema.type) return false;

          // Type must be a valid JSON Schema type
          const validTypes = ["object", "array", "string", "number", "integer", "boolean", "null"];
          if (!validTypes.includes(schema.type)) return false;

          return true;
        },
        {
          message: 'Schema musi być prawidłowym obiektem JSON Schema z wymaganą właściwością "type"',
        }
      ),
  })
  .strict();

/**
 * Schema for validating API key
 */
export const ApiKeySchema = z
  .string({
    required_error: "Klucz API jest wymagany",
    invalid_type_error: "Klucz API musi być tekstem",
  })
  .min(20, "Klucz API jest zbyt krótki")
  .max(200, "Klucz API jest zbyt długi")
  .regex(/^sk-/, 'Klucz API musi zaczynać się od "sk-"')
  .refine((key) => !key.includes(" "), {
    message: "Klucz API nie może zawierać spacji",
  });

/**
 * Schema for validating model names
 */
export const ModelNameSchema = z
  .string({
    required_error: "Nazwa modelu jest wymagana",
    invalid_type_error: "Nazwa modelu musi być tekstem",
  })
  .min(1, "Nazwa modelu nie może być pusta")
  .max(100, "Nazwa modelu jest zbyt długa")
  .regex(/^[a-zA-Z0-9/_-]+$/, "Nazwa modelu może zawierać tylko litery, cyfry, /, _, -");

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Validate chat messages array
 */
export const validateChatMessages = (messages: unknown[]): ChatMessage[] => {
  try {
    return ChatMessagesSchema.parse(messages);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new Error(`Błąd walidacji wiadomości: ${firstError.message}`);
    }
    throw error;
  }
};

/**
 * Validate single chat message
 */
export const validateChatMessage = (message: unknown): ChatMessage => {
  try {
    return ChatMessageSchema.parse(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new Error(`Błąd walidacji wiadomości: ${firstError.message}`);
    }
    throw error;
  }
};

/**
 * Validate chat options
 */
export const validateChatOptions = (options: unknown): ChatOptions => {
  try {
    return ChatOptionsSchema.parse(options);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new Error(`Błąd walidacji opcji: ${firstError.message}`);
    }
    throw error;
  }
};

/**
 * Validate model parameters
 */
export const validateModelParameters = (params: unknown): ModelParameters => {
  try {
    return ModelParametersSchema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new Error(`Błąd walidacji parametrów modelu: ${firstError.message}`);
    }
    throw error;
  }
};

/**
 * Validate JSON schema
 */
export const validateJsonSchema = (schema: unknown): JsonSchema => {
  try {
    return JsonSchemaSchema.parse(schema);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new Error(`Błąd walidacji schematu JSON: ${firstError.message}`);
    }
    throw error;
  }
};

/**
 * Validate API key
 */
export const validateApiKey = (apiKey: unknown): string => {
  try {
    return ApiKeySchema.parse(apiKey);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new Error(`Błąd walidacji klucza API: ${firstError.message}`);
    }
    throw error;
  }
};

/**
 * Validate model name
 */
export const validateModelName = (modelName: unknown): string => {
  try {
    return ModelNameSchema.parse(modelName);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new Error(`Błąd walidacji nazwy modelu: ${firstError.message}`);
    }
    throw error;
  }
};

/**
 * Validate if content is safe (basic XSS protection)
 */
export const validateSafeContent = (content: string): boolean => {
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(content));
};

/**
 * Get detailed validation errors for better debugging
 */
export const getValidationErrors = (error: z.ZodError): string[] => {
  return error.errors.map((err) => {
    const path = err.path.length > 0 ? ` (${err.path.join(".")})` : "";
    return `${err.message}${path}`;
  });
};

/**
 * Check if error is a validation error from Zod
 */
export const isValidationError = (error: unknown): error is z.ZodError => {
  return error instanceof z.ZodError;
};
