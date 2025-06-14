import { z } from 'zod';

// UUID validation regex - more liberal for mock environment
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Flashcard status enum values
const FLASHCARD_STATUSES = ['draft', 'published', 'archived'] as const;

// Bulk operation types
const BULK_OPERATIONS = ['delete', 'change_status', 'assign_categories', 'assign_groups'] as const;

/**
 * Schema for bulk delete operations
 * Used with DELETE /api/flashcards/bulk
 */
export const bulkDeleteSchema = z.object({
  flashcard_ids: z
    .array(
      z.string().regex(UUID_REGEX, 'Nieprawidłowy format UUID fiszki')
    )
    .min(1, 'Wymagana jest przynajmniej jedna fiszka do usunięcia')
    .max(100, 'Maksymalnie 100 fiszek na operację masową')
});

/**
 * Schema for bulk operations with data payload
 * Used with PUT /api/flashcards/bulk
 */
export const bulkOperationSchema = z.object({
  flashcard_ids: z
    .array(
      z.string().regex(UUID_REGEX, 'Nieprawidłowy format UUID fiszki')
    )
    .min(1, 'Wymagana jest przynajmniej jedna fiszka do operacji')
    .max(100, 'Maksymalnie 100 fiszek na operację masową'),
  
  operation: z.enum(BULK_OPERATIONS),
  
  data: z.object({
    // For change_status operation
    status: z.enum(FLASHCARD_STATUSES).optional(),
    
    // For assign_categories operation
    category_ids: z
      .array(
        z.string().regex(UUID_REGEX, 'Nieprawidłowy format UUID kategorii')
      )
      .max(10, 'Maksymalnie 10 kategorii na operację')
      .optional(),
    
    // For assign_groups operation
    group_ids: z
      .array(
        z.string().regex(UUID_REGEX, 'Nieprawidłowy format UUID grupy')
      )
      .max(10, 'Maksymalnie 10 grup na operację')
      .optional()
  }).optional()
}).refine((data) => {
  // Validate operation-specific data requirements
  switch (data.operation) {
    case 'change_status':
      return data.data?.status !== undefined;
    case 'assign_categories':
      return data.data?.category_ids !== undefined && data.data.category_ids.length > 0;
    case 'assign_groups':
      return data.data?.group_ids !== undefined && data.data.group_ids.length > 0;
    case 'delete':
      return true; // No additional data required for delete
    default:
      return false;
  }
}, {
  message: 'Operacja wymaga odpowiednich danych w polu data',
  path: ['data']
});

/**
 * Type inference from schemas
 */
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;
export type BulkOperationInput = z.infer<typeof bulkOperationSchema>;

/**
 * Validation function for bulk delete requests
 */
export const validateBulkDeleteRequest = async (data: unknown) => {
  try {
    return bulkDeleteSchema.parse(data);
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
        message: 'Nieprawidłowe dane wejściowe dla operacji masowego usuwania',
        details: formattedErrors,
        statusCode: 400
      };
    }
    throw error;
  }
};

/**
 * Validation function for bulk operations requests
 */
export const validateBulkOperationRequest = async (data: unknown) => {
  try {
    return bulkOperationSchema.parse(data);
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
        message: 'Nieprawidłowe dane wejściowe dla operacji masowej',
        details: formattedErrors,
        statusCode: 400
      };
    }
    throw error;
  }
};

/**
 * Validation function for flashcard IDs array
 */
export const validateFlashcardIds = (flashcard_ids: unknown): string[] => {
  if (!Array.isArray(flashcard_ids)) {
    throw {
      type: 'VALIDATION_ERROR',
      message: 'flashcard_ids musi być tablicą',
      statusCode: 400
    };
  }

  const validatedIds: string[] = [];
  
  for (const id of flashcard_ids) {
    if (typeof id !== 'string' || !UUID_REGEX.test(id)) {
      throw {
        type: 'VALIDATION_ERROR',
        message: `Nieprawidłowy format UUID: ${id}`,
        statusCode: 400
      };
    }
    validatedIds.push(id);
  }

  if (validatedIds.length === 0) {
    throw {
      type: 'VALIDATION_ERROR',
      message: 'Wymagana jest przynajmniej jedna fiszka',
      statusCode: 400
    };
  }

  if (validatedIds.length > 100) {
    throw {
      type: 'VALIDATION_ERROR',
      message: 'Maksymalnie 100 fiszek na operację masową',
      statusCode: 400
    };
  }

  return validatedIds;
}; 