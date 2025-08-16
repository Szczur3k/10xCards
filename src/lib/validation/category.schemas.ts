import { z } from "zod";

// Schema dla tworzenia kategorii
export const createCategoryRequestSchema = z.object({
  name: z
    .string()
    .min(1, "Nazwa kategorii jest wymagana")
    .max(100, "Nazwa kategorii nie może przekraczać 100 znaków")
    .trim(),
  description: z.string().max(1000, "Opis kategorii nie może przekraczać 1000 znaków").trim().optional(),
});

// Schema dla aktualizacji kategorii
export const updateCategoryRequestSchema = z
  .object({
    name: z
      .string()
      .min(1, "Nazwa kategorii nie może być pusta")
      .max(100, "Nazwa kategorii nie może przekraczać 100 znaków")
      .trim()
      .optional(),
    description: z.string().max(1000, "Opis kategorii nie może przekraczać 1000 znaków").trim().optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "Przynajmniej jedno pole (name lub description) musi być podane",
    path: ["root"],
  });

// Schema dla walidacji UUID w path parameters
export const categoryIdSchema = z.string().uuid("Nieprawidłowy format UUID kategorii");
