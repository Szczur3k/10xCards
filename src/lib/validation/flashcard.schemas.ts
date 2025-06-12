import { z } from 'zod';
import type { FlashcardStatus } from '../../types';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Flashcard status enum values
const FLASHCARD_STATUSES = ['draft', 'published', 'archived'] as const;

// Flashcard creation type enum values
const FLASHCARD_TYPES = ['manual', 'llm'] as const;

// Sort field enum values
const SORT_FIELDS = ['created_at', 'updated_at'] as const;

// Order direction enum values
const ORDER_DIRECTIONS = ['asc', 'desc'] as const;

/**
 * Schema for creating a new flashcard manually
 * Validates CreateFlashcardRequestDTO structure
 */
export const createFlashcardSchema = z.object({
  front: z
    .string()
    .min(1, 'Treść przodu fiszki jest wymagana')
    .max(200, 'Treść przodu fiszki nie może przekraczać 200 znaków')
    .trim(),
  
  back: z
    .string()
    .min(1, 'Treść tyłu fiszki jest wymagana')
    .max(500, 'Treść tyłu fiszki nie może przekraczać 500 znaków')
    .trim(),
  
  status: z
    .enum(FLASHCARD_STATUSES)
    .default('draft')
    .optional(),
  
  category_ids: z
    .array(
      z.string().regex(UUID_REGEX, 'Nieprawidłowy format UUID kategorii')
    )
    .max(10, 'Maksymalnie 10 kategorii na fiszkę')
    .optional(),
  
  group_ids: z
    .array(
      z.string().regex(UUID_REGEX, 'Nieprawidłowy format UUID grupy')
    )
    .max(10, 'Maksymalnie 10 grup na fiszkę')
    .optional()
});

/**
 * Schema for UUID validation
 */
export const uuidSchema = z.string().regex(UUID_REGEX, 'Nieprawidłowy format UUID');

/**
 * Schema for validating arrays of UUIDs
 */
export const uuidArraySchema = z.array(uuidSchema).optional();

/**
 * Type inference from schema
 */
export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;

/**
 * Schema for GET /api/flashcards query parameters
 * Validates FlashcardQueryParams structure
 */
export const getFlashcardsQuerySchema = z.object({
  page: z
    .string()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, 'Numer strony musi być większy niż 0'),
  
  limit: z
    .string()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 100, 'Limit musi być między 1 a 100'),
  
  status: z
    .enum(FLASHCARD_STATUSES)
    .optional(),
  
  creation_type: z
    .enum(FLASHCARD_TYPES)
    .optional(),
  
  category_id: z
    .string()
    .regex(UUID_REGEX, 'Nieprawidłowy format UUID kategorii')
    .optional(),
  
  group_id: z
    .string()
    .regex(UUID_REGEX, 'Nieprawidłowy format UUID grupy')
    .optional(),
  
  sort: z
    .enum(SORT_FIELDS)
    .default('created_at')
    .optional(),
  
  order: z
    .enum(ORDER_DIRECTIONS)
    .default('desc')
    .optional()
});

/**
 * Type inference from GET query schema
 */
export type GetFlashcardsQueryInput = z.infer<typeof getFlashcardsQuerySchema>;

/**
 * Validation function with detailed error handling
 */
export const validateCreateFlashcardRequest = async (data: unknown) => {
  try {
    return createFlashcardSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string[]> = {};
      
      error.errors.forEach((err) => {
        const field = err.path.join('.');
        if (!formattedErrors[field]) {
          formattedErrors[field] = [];
        }
        formattedErrors[field].push(err.message);
      });
      
      throw {
        type: 'VALIDATION_ERROR',
        message: 'Nieprawidłowe dane wejściowe',
        details: formattedErrors,
        statusCode: 400
      };
    }
    throw error;
  }
};

/**
 * Validation function for GET flashcards query parameters
 */
export const validateGetFlashcardsQuery = async (searchParams: URLSearchParams) => {
  try {
    // Convert URLSearchParams to object
    const queryObject: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      queryObject[key] = value;
    });
    
    return getFlashcardsQuerySchema.parse(queryObject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string[]> = {};
      
      error.errors.forEach((err) => {
        const field = err.path.join('.');
        if (!formattedErrors[field]) {
          formattedErrors[field] = [];
        }
        formattedErrors[field].push(err.message);
      });
      
      throw {
        type: 'VALIDATION_ERROR',
        message: 'Nieprawidłowe parametry zapytania',
        details: formattedErrors,
        statusCode: 400
      };
    }
    throw error;
  }
}; 