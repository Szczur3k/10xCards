import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { CreateCategoryCommand, UpdateCategoryCommand, CategoryDTO, CategoryListResponseDTO } from "../../types";

/**
 * Service for managing category operations
 * Handles business logic and database interactions for categories
 */
export class CategoryService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Gets all categories for a user with flashcard count
   * @param userId - User ID for filtering categories
   * @returns Promise<CategoryListResponseDTO> - List of categories with flashcard counts
   */
  async getCategories(userId: string): Promise<CategoryListResponseDTO> {
    // Get categories with flashcard count using LEFT JOIN
    const { data: categories, error } = await this.supabase
      .from("categories")
      .select(
        `
        id,
        name,
        description,
        created_at,
        flashcard_categories!left(flashcard_id)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw {
        type: "DATABASE_ERROR",
        message: "Błąd podczas pobierania kategorii",
        details: { database: [error.message] },
        statusCode: 500,
      };
    }

    // Transform data to include flashcard count
    const categoryDTOs: CategoryDTO[] = (categories || []).map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      flashcard_count: category.flashcard_categories?.length || 0,
      created_at: category.created_at,
    }));

    return {
      data: categoryDTOs,
    };
  }

  /**
   * Creates a new category
   * @param command - CreateCategoryCommand with category data
   * @param userId - User ID for ownership
   * @returns Promise<CategoryDTO> - Created category
   */
  async createCategory(command: CreateCategoryCommand, userId: string): Promise<CategoryDTO> {
    // Check if category with same name already exists for this user
    const { data: existingCategory } = await this.supabase
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .eq("name", command.name)
      .single();

    if (existingCategory) {
      throw {
        type: "CONFLICT_ERROR",
        message: "Kategoria o tej nazwie już istnieje",
        details: { name: ["Kategoria o tej nazwie już istnieje"] },
        statusCode: 409,
      };
    }

    // Create new category
    const { data: category, error } = await this.supabase
      .from("categories")
      .insert({
        name: command.name,
        description: command.description || null,
        user_id: userId,
      })
      .select("*")
      .single();

    if (error) {
      throw {
        type: "DATABASE_ERROR",
        message: "Błąd podczas tworzenia kategorii",
        details: { database: [error.message] },
        statusCode: 500,
      };
    }

    if (!category) {
      throw {
        type: "DATABASE_ERROR",
        message: "Nie udało się utworzyć kategorii",
        statusCode: 500,
      };
    }

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      flashcard_count: 0, // New category has no flashcards
      created_at: category.created_at,
    };
  }

  /**
   * Updates an existing category
   * @param command - UpdateCategoryCommand with category data
   * @param userId - User ID for ownership validation
   * @returns Promise<CategoryDTO> - Updated category
   */
  async updateCategory(command: UpdateCategoryCommand, userId: string): Promise<CategoryDTO> {
    // Check if category exists and belongs to user
    const { data: existingCategory, error: fetchError } = await this.supabase
      .from("categories")
      .select("*")
      .eq("id", command.id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingCategory) {
      throw {
        type: "NOT_FOUND_ERROR",
        message: "Kategoria o podanym ID nie została znaleziona",
        statusCode: 404,
      };
    }

    // Check for name uniqueness if name is being changed
    if (command.name && command.name !== existingCategory.name) {
      const { data: duplicateCategory } = await this.supabase
        .from("categories")
        .select("id")
        .eq("user_id", userId)
        .eq("name", command.name)
        .neq("id", command.id)
        .single();

      if (duplicateCategory) {
        throw {
          type: "CONFLICT_ERROR",
          message: "Kategoria o tej nazwie już istnieje",
          details: { name: ["Kategoria o tej nazwie już istnieje"] },
          statusCode: 409,
        };
      }
    }

    // Update category
    const updateData: Record<string, unknown> = {};
    if (command.name !== undefined) updateData.name = command.name;
    if (command.description !== undefined) updateData.description = command.description;

    const { data: updatedCategory, error: updateError } = await this.supabase
      .from("categories")
      .update(updateData)
      .eq("id", command.id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (updateError) {
      throw {
        type: "DATABASE_ERROR",
        message: "Błąd podczas aktualizacji kategorii",
        details: { database: [updateError.message] },
        statusCode: 500,
      };
    }

    if (!updatedCategory) {
      throw {
        type: "DATABASE_ERROR",
        message: "Nie udało się zaktualizować kategorii",
        statusCode: 500,
      };
    }

    // Get flashcard count for updated category
    const { data: flashcardCount } = await this.supabase
      .from("flashcard_categories")
      .select("flashcard_id", { count: "exact" })
      .eq("category_id", command.id);

    return {
      id: updatedCategory.id,
      name: updatedCategory.name,
      description: updatedCategory.description,
      flashcard_count: flashcardCount?.length || 0,
      created_at: updatedCategory.created_at,
    };
  }

  /**
   * Deletes a category (only for admins or if no flashcards assigned)
   * @param categoryId - Category ID to delete
   * @param userId - User ID for ownership validation
   * @param userRole - User role for admin check
   * @returns Promise<void>
   */
  async deleteCategory(categoryId: string, userId: string, userRole: string): Promise<void> {
    // Check if category exists and belongs to user
    const { data: existingCategory, error: fetchError } = await this.supabase
      .from("categories")
      .select("*")
      .eq("id", categoryId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingCategory) {
      throw {
        type: "NOT_FOUND_ERROR",
        message: "Kategoria o podanym ID nie została znaleziona",
        statusCode: 404,
      };
    }

    // Check if category has assigned flashcards
    const { data: assignedFlashcards, error: countError } = await this.supabase
      .from("flashcard_categories")
      .select("flashcard_id", { count: "exact" })
      .eq("category_id", categoryId);

    if (countError) {
      throw {
        type: "DATABASE_ERROR",
        message: "Błąd podczas sprawdzania przypisanych fiszek",
        details: { database: [countError.message] },
        statusCode: 500,
      };
    }

    // Only admins can delete categories with assigned flashcards
    if (assignedFlashcards && assignedFlashcards.length > 0 && userRole !== "admin") {
      throw {
        type: "CONFLICT_ERROR",
        message: "Nie można usunąć kategorii - ma przypisane fiszki",
        details: { category: ["Kategoria ma przypisane fiszki i może być usunięta tylko przez administratora"] },
        statusCode: 409,
      };
    }

    // Delete category (cascade will handle flashcard_categories relationships)
    const { error: deleteError } = await this.supabase
      .from("categories")
      .delete()
      .eq("id", categoryId)
      .eq("user_id", userId);

    if (deleteError) {
      throw {
        type: "DATABASE_ERROR",
        message: "Błąd podczas usuwania kategorii",
        details: { database: [deleteError.message] },
        statusCode: 500,
      };
    }
  }
}
