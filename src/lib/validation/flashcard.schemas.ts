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
 * Schema for updating an existing flashcard
 * All fields are optional - validates UpdateFlashcardRequestDTO structure
 */
export const updateFlashcardSchema = z.object({
  front: z
    .string()
    .min(1, 'Treść przodu fiszki nie może być pusta')
    .max(200, 'Treść przodu fiszki nie może przekraczać 200 znaków')
    .trim()
    .optional(),
  
  back: z
    .string()
    .min(1, 'Treść tyłu fiszki nie może być pusta')
    .max(500, 'Treść tyłu fiszki nie może przekraczać 500 znaków')
    .trim()
    .optional(),
  
  status: z
    .enum(FLASHCARD_STATUSES)
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
}).refine(
  (data) => Object.keys(data).length > 0,
  'Wymagane jest podanie przynajmniej jednego pola do aktualizacji'
);

/**
 * Type inference from schemas
 */
export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;
export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;

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

/**
 * Validation function for updating flashcard
 */
export const validateUpdateFlashcardRequest = async (data: unknown) => {
  try {
    return updateFlashcardSchema.parse(data);
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
        message: 'Nieprawidłowe dane do aktualizacji',
        details: formattedErrors,
        statusCode: 400
      };
    }
    throw error;
  }
};

/**
 * Validation function for UUID (used for path parameters)
 */
export const validateUUID = (id: string, fieldName: string = 'id') => {
  try {
    return uuidSchema.parse(id);
  } catch (error) {
    throw {
      type: 'VALIDATION_ERROR',
      message: `Nieprawidłowy format ${fieldName}`,
      details: { [fieldName]: ['Nieprawidłowy format UUID'] },
      statusCode: 400
    };
  }
};

// Generate flashcards request validation (obsługuje generate i regenerate)
export const generateFlashcardsSchema = z.object({
  source_text: z.string()
    .min(10, 'Tekst źródłowy musi mieć co najmniej 10 znaków')
    .max(50000, 'Tekst źródłowy nie może przekraczać 50,000 znaków')
    .optional(),
  source_text_id: uuidSchema.optional(),
  max_flashcards: z.number()
    .int('Liczba fiszek musi być liczbą całkowitą')
    .min(1, 'Minimalna liczba fiszek to 1')
    .max(100, 'Maksymalna liczba fiszek to 100')
    .optional()
    .default(20),
  model: z.string()
    .min(1, 'Nazwa modelu nie może być pusta')
    .optional(),
  category_ids: z.array(uuidSchema)
    .max(10, 'Maksymalnie 10 kategorii')
    .optional(),
  group_ids: z.array(uuidSchema)
    .max(10, 'Maksymalnie 10 grup')
    .optional()
}).refine(
  (data) => data.source_text || data.source_text_id,
  {
    message: 'Wymagany jest source_text (dla nowego) lub source_text_id (dla regeneracji)',
    path: ['source_text']
  }
).refine(
  (data) => !(data.source_text && data.source_text_id),
  {
    message: 'Nie można podać jednocześnie source_text i source_text_id',
    path: ['source_text']
  }
);

// Validation functions
export function validateGenerateFlashcardsRequest(data: unknown) {
  try {
    return {
      success: true,
      data: generateFlashcardsSchema.parse(data)
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details: Record<string, string[]> = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        if (!details[path]) details[path] = [];
        details[path].push(err.message);
      });
      
      return {
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Nieprawidłowe dane żądania',
          details,
          statusCode: 400
        }
      };
    }
    
    return {
      success: false,
      error: {
        type: 'VALIDATION_ERROR',
        message: 'Błąd walidacji danych',
        statusCode: 400
      }
    };
  }
}

export function validateSourceTextId(id: string) {
  try {
    return {
      success: true,
      data: uuidSchema.parse(id)
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'VALIDATION_ERROR',
        message: 'Nieprawidłowy identyfikator tekstu źródłowego',
        statusCode: 400
      }
    };
  }
} 