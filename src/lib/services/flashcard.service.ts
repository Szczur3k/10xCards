import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { 
  CreateFlashcardCommand, 
  FlashcardDTO, 
  FlashcardInsert,
  FlashcardQueryParams,
  FlashcardListResponseDTO,
  PaginationDTO
} from '../../types';

/**
 * Service for managing flashcard operations
 * Handles business logic and database interactions
 */
export class FlashcardService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Creates a new flashcard with categories and groups
   * @param command - CreateFlashcardCommand with all required data
   * @returns Promise<FlashcardDTO> - Created flashcard with full data
   */
  async createFlashcard(command: CreateFlashcardCommand): Promise<FlashcardDTO> {
    // Start database transaction
    const { data: flashcard, error: flashcardError } = await this.supabase
      .from('flashcards')
      .insert({
        front: command.front,
        back: command.back,
        creation_type: command.creation_type,
        status: command.status || 'draft',
        user_id: command.user_id,
        source_text_id: command.source_text_id || null
      })
      .select('*')
      .single();

    if (flashcardError) {
      throw {
        type: 'DATABASE_ERROR',
        message: 'Błąd podczas tworzenia fiszki',
        details: { database: [flashcardError.message] },
        statusCode: 500
      };
    }

    if (!flashcard) {
      throw {
        type: 'DATABASE_ERROR',
        message: 'Nie udało się utworzyć fiszki',
        statusCode: 500
      };
    }

    // Validate and create category relationships
    let categories: Array<{id: string, name: string}> = [];
    if (command.category_ids && command.category_ids.length > 0) {
      categories = await this.createCategoryRelationships(flashcard.id, command.category_ids);
    }

    // Validate and create group relationships
    let groups: Array<{id: string, name: string}> = [];
    if (command.group_ids && command.group_ids.length > 0) {
      groups = await this.createGroupRelationships(flashcard.id, command.group_ids);
    }

    // Return complete FlashcardDTO
    return {
      id: flashcard.id,
      front: flashcard.front,
      back: flashcard.back,
      creation_type: flashcard.creation_type,
      status: flashcard.status,
      source_text_id: flashcard.source_text_id,
      categories,
      groups,
      created_at: flashcard.created_at,
      updated_at: flashcard.updated_at
    };
  }

  /**
   * Creates relationships between flashcard and categories
   * @param flashcardId - UUID of the flashcard
   * @param categoryIds - Array of category UUIDs
   * @returns Promise<Array<{id: string, name: string}>> - Category data
   */
  private async createCategoryRelationships(
    flashcardId: string, 
    categoryIds: string[]
  ): Promise<Array<{id: string, name: string}>> {
    // First validate that all categories exist
    const { data: existingCategories, error: categoriesError } = await this.supabase
      .from('categories')
      .select('id, name')
      .in('id', categoryIds);

    if (categoriesError) {
      throw {
        type: 'DATABASE_ERROR',
        message: 'Błąd podczas sprawdzania kategorii',
        details: { database: [categoriesError.message] },
        statusCode: 500
      };
    }

    if (!existingCategories || existingCategories.length !== categoryIds.length) {
      const foundIds = existingCategories?.map(c => c.id) || [];
      const missingIds = categoryIds.filter(id => !foundIds.includes(id));
      
      throw {
        type: 'NOT_FOUND_ERROR',
        message: 'Niektóre kategorie nie zostały znalezione',
        details: { category_ids: [`Nie znaleziono kategorii: ${missingIds.join(', ')}`] },
        statusCode: 404
      };
    }

    // Create flashcard-category relationships
    const categoryRelations = categoryIds.map(categoryId => ({
      flashcard_id: flashcardId,
      category_id: categoryId
    }));

    const { error: relationError } = await this.supabase
      .from('flashcard_categories')
      .insert(categoryRelations);

    if (relationError) {
      // Cleanup: delete the flashcard if category relations failed
      await this.supabase.from('flashcards').delete().eq('id', flashcardId);
      
      throw {
        type: 'DATABASE_ERROR',
        message: 'Błąd podczas przypisywania kategorii',
        details: { database: [relationError.message] },
        statusCode: 500
      };
    }

    return existingCategories;
  }

  /**
   * Creates relationships between flashcard and groups
   * @param flashcardId - UUID of the flashcard
   * @param groupIds - Array of group UUIDs
   * @returns Promise<Array<{id: string, name: string}>> - Group data
   */
  private async createGroupRelationships(
    flashcardId: string, 
    groupIds: string[]
  ): Promise<Array<{id: string, name: string}>> {
    // First validate that all groups exist
    const { data: existingGroups, error: groupsError } = await this.supabase
      .from('groups')
      .select('id, name')
      .in('id', groupIds);

    if (groupsError) {
      throw {
        type: 'DATABASE_ERROR',
        message: 'Błąd podczas sprawdzania grup',
        details: { database: [groupsError.message] },
        statusCode: 500
      };
    }

    if (!existingGroups || existingGroups.length !== groupIds.length) {
      const foundIds = existingGroups?.map(g => g.id) || [];
      const missingIds = groupIds.filter(id => !foundIds.includes(id));
      
      throw {
        type: 'NOT_FOUND_ERROR',
        message: 'Niektóre grupy nie zostały znalezione',
        details: { group_ids: [`Nie znaleziono grup: ${missingIds.join(', ')}`] },
        statusCode: 404
      };
    }

    // Create flashcard-group relationships
    const groupRelations = groupIds.map(groupId => ({
      flashcard_id: flashcardId,
      group_id: groupId
    }));

    const { error: relationError } = await this.supabase
      .from('flashcard_groups')
      .insert(groupRelations);

    if (relationError) {
      // Cleanup: delete the flashcard if group relations failed
      await this.supabase.from('flashcards').delete().eq('id', flashcardId);
      
      throw {
        type: 'DATABASE_ERROR',
        message: 'Błąd podczas przypisywania grup',
        details: { database: [relationError.message] },
        statusCode: 500
      };
    }

    return existingGroups;
  }

  /**
   * Gets flashcards for a user with filtering, sorting and pagination
   * @param userId - UUID of the user
   * @param params - Query parameters for filtering and pagination
   * @returns Promise<FlashcardListResponseDTO> - Paginated list of flashcards
   */
  async getFlashcards(userId: string, params: FlashcardQueryParams): Promise<FlashcardListResponseDTO> {
    // Build the base query
    let query = this.supabase
      .from('flashcards')
      .select(`
        *,
        flashcard_categories (
          categories (
            id,
            name
          )
        ),
        flashcard_groups (
          groups (
            id,
            name
          )
        )
      `)
      .eq('user_id', userId);

    // Apply filters
    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.creation_type) {
      query = query.eq('creation_type', params.creation_type);
    }

    // Note: Category and group filtering will be handled differently
    // We'll filter after getting the data due to Supabase limitations with complex JOINs

    // Apply sorting
    const sortField = params.sort || 'created_at';
    const sortOrder = params.order || 'desc';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Execute the main query (without pagination first, for filtering)
    const { data: allFlashcards, error: flashcardsError } = await query;

    if (flashcardsError) {
      throw {
        type: 'DATABASE_ERROR',
        message: 'Błąd podczas pobierania fiszek',
        details: { database: [flashcardsError.message] },
        statusCode: 500
      };
    }

    if (!allFlashcards) {
      throw {
        type: 'DATABASE_ERROR',
        message: 'Nie udało się pobrać fiszek',
        statusCode: 500
      };
    }

    // Transform data to FlashcardDTO format and apply client-side filtering
    let flashcardDTOs: FlashcardDTO[] = allFlashcards.map((flashcard: any) => ({
      id: flashcard.id,
      front: flashcard.front,
      back: flashcard.back,
      creation_type: flashcard.creation_type,
      status: flashcard.status,
      source_text_id: flashcard.source_text_id,
      categories: flashcard.flashcard_categories?.map((fc: any) => ({
        id: fc.categories?.id || '',
        name: fc.categories?.name || ''
      })).filter((c: any) => c.id) || [],
      groups: flashcard.flashcard_groups?.map((fg: any) => ({
        id: fg.groups?.id || '',
        name: fg.groups?.name || ''
      })).filter((g: any) => g.id) || [],
      created_at: flashcard.created_at,
      updated_at: flashcard.updated_at
    }));

    // Apply client-side filtering for categories and groups
    if (params.category_id) {
      flashcardDTOs = flashcardDTOs.filter(flashcard => 
        flashcard.categories.some(cat => cat.id === params.category_id)
      );
    }

    if (params.group_id) {
      flashcardDTOs = flashcardDTOs.filter(flashcard => 
        flashcard.groups.some(group => group.id === params.group_id)
      );
    }

    // Apply pagination after filtering
    const page = params.page || 1;
    const limit = params.limit || 20;
    const total = flashcardDTOs.length;
    const pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedFlashcards = flashcardDTOs.slice(offset, offset + limit);

    const pagination: PaginationDTO = {
      page,
      limit,
      total,
      pages
    };

    return {
      data: paginatedFlashcards,
      pagination
    };
  }

  /**
   * Validates if user has access to specific categories/groups
   * Currently categories and groups are global, but this method
   * provides foundation for future user-specific access control
   */
  private async validateUserAccess(userId: string): Promise<boolean> {
    // For MVP, all users have access to all categories and groups
    // This method can be extended for user-specific permissions
    return true;
  }
} 