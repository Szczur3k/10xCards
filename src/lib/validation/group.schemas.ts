import { z } from "zod";

// Schema dla tworzenia grupy
export const createGroupRequestSchema = z.object({
  name: z.string().min(1, "Nazwa grupy jest wymagana").max(100, "Nazwa grupy nie może przekraczać 100 znaków").trim(),
  description: z.string().max(1000, "Opis grupy nie może przekraczać 1000 znaków").trim().optional(),
});

// Schema dla aktualizacji grupy
export const updateGroupRequestSchema = z
  .object({
    name: z
      .string()
      .min(1, "Nazwa grupy nie może być pusta")
      .max(100, "Nazwa grupy nie może przekraczać 100 znaków")
      .trim()
      .optional(),
    description: z.string().max(1000, "Opis grupy nie może przekraczać 1000 znaków").trim().optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "Przynajmniej jedno pole (name lub description) musi być podane",
    path: ["root"],
  });

// Schema dla walidacji UUID w path parameters
export const groupIdSchema = z.string().uuid("Nieprawidłowy format UUID grupy");
