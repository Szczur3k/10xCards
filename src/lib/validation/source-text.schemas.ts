import { z } from "zod";
import type { SourceTextQueryParams } from "../../types";

/**
 * Schema for validating source text query parameters
 */
export const sourceTextQueryParamsSchema = z.object({
  page: z.coerce.number().int().min(1, "Numer strony musi być większy niż 0").optional().default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit musi być większy niż 0")
    .max(100, "Limit nie może przekraczać 100")
    .optional()
    .default(20),
});

/**
 * Schema for validating UUID format
 */
export const uuidSchema = z.string().uuid("Nieprawidłowy format UUID");

/**
 * Validates source text query parameters
 * @param params - Raw query parameters from request
 * @returns Validated and transformed parameters
 * @throws Validation error with detailed messages
 */
export function validateSourceTextQueryParams(params: unknown): SourceTextQueryParams {
  try {
    return sourceTextQueryParamsSchema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details: Record<string, string[]> = {};

      error.errors.forEach((err) => {
        const field = err.path.join(".");
        if (!details[field]) {
          details[field] = [];
        }
        details[field].push(err.message);
      });

      throw {
        type: "VALIDATION_ERROR",
        message: "Nieprawidłowe parametry zapytania",
        details,
        statusCode: 400,
      };
    }
    throw error;
  }
}

/**
 * Validates UUID format
 * @param id - UUID string to validate
 * @param fieldName - Name of the field for error messages
 * @returns Validated UUID string
 * @throws Validation error if UUID is invalid
 */
export function validateUUID(id: string, fieldName = "id"): string {
  try {
    return uuidSchema.parse(id);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        type: "VALIDATION_ERROR",
        message: `Nieprawidłowy format ${fieldName}`,
        details: {
          [fieldName]: ["Nieprawidłowy format UUID"],
        },
        statusCode: 400,
      };
    }
    throw error;
  }
}
