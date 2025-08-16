import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { CreateGroupCommand, UpdateGroupCommand, GroupDTO, GroupListResponseDTO } from "../../types";

/**
 * Service for managing group operations
 * Handles business logic and database interactions for groups
 */
export class GroupService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Gets all groups for a user with flashcard count
   * @param userId - User ID for filtering groups
   * @returns Promise<GroupListResponseDTO> - List of groups with flashcard counts
   */
  async getGroups(userId: string): Promise<GroupListResponseDTO> {
    // Get groups with flashcard count using LEFT JOIN
    const { data: groups, error } = await this.supabase
      .from("groups")
      .select(
        `
        id,
        name,
        description,
        created_at,
        flashcard_groups!left(flashcard_id)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw {
        type: "DATABASE_ERROR",
        message: "Błąd podczas pobierania grup",
        details: { database: [error.message] },
        statusCode: 500,
      };
    }

    // Transform data to include flashcard count
    const groupDTOs: GroupDTO[] = (groups || []).map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      flashcard_count: group.flashcard_groups?.length || 0,
      created_at: group.created_at,
    }));

    return {
      data: groupDTOs,
    };
  }

  /**
   * Creates a new group
   * @param command - CreateGroupCommand with group data
   * @param userId - User ID for ownership
   * @returns Promise<GroupDTO> - Created group
   */
  async createGroup(command: CreateGroupCommand, userId: string): Promise<GroupDTO> {
    // Check if group with same name already exists for this user
    const { data: existingGroup } = await this.supabase
      .from("groups")
      .select("id")
      .eq("user_id", userId)
      .eq("name", command.name)
      .single();

    if (existingGroup) {
      throw {
        type: "CONFLICT_ERROR",
        message: "Grupa o tej nazwie już istnieje",
        details: { name: ["Grupa o tej nazwie już istnieje"] },
        statusCode: 409,
      };
    }

    // Create new group
    const { data: group, error } = await this.supabase
      .from("groups")
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
        message: "Błąd podczas tworzenia grupy",
        details: { database: [error.message] },
        statusCode: 500,
      };
    }

    if (!group) {
      throw {
        type: "DATABASE_ERROR",
        message: "Nie udało się utworzyć grupy",
        statusCode: 500,
      };
    }

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      flashcard_count: 0, // New group has no flashcards
      created_at: group.created_at,
    };
  }

  /**
   * Updates an existing group
   * @param command - UpdateGroupCommand with group data
   * @param userId - User ID for ownership validation
   * @returns Promise<GroupDTO> - Updated group
   */
  async updateGroup(command: UpdateGroupCommand, userId: string): Promise<GroupDTO> {
    // Check if group exists and belongs to user
    const { data: existingGroup, error: fetchError } = await this.supabase
      .from("groups")
      .select("*")
      .eq("id", command.id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingGroup) {
      throw {
        type: "NOT_FOUND_ERROR",
        message: "Grupa o podanym ID nie została znaleziona",
        statusCode: 404,
      };
    }

    // Check for name uniqueness if name is being changed
    if (command.name && command.name !== existingGroup.name) {
      const { data: duplicateGroup } = await this.supabase
        .from("groups")
        .select("id")
        .eq("user_id", userId)
        .eq("name", command.name)
        .neq("id", command.id)
        .single();

      if (duplicateGroup) {
        throw {
          type: "CONFLICT_ERROR",
          message: "Grupa o tej nazwie już istnieje",
          details: { name: ["Grupa o tej nazwie już istnieje"] },
          statusCode: 409,
        };
      }
    }

    // Update group
    const updateData: any = {};
    if (command.name !== undefined) updateData.name = command.name;
    if (command.description !== undefined) updateData.description = command.description;

    const { data: updatedGroup, error: updateError } = await this.supabase
      .from("groups")
      .update(updateData)
      .eq("id", command.id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (updateError) {
      throw {
        type: "DATABASE_ERROR",
        message: "Błąd podczas aktualizacji grupy",
        details: { database: [updateError.message] },
        statusCode: 500,
      };
    }

    if (!updatedGroup) {
      throw {
        type: "DATABASE_ERROR",
        message: "Nie udało się zaktualizować grupy",
        statusCode: 500,
      };
    }

    // Get flashcard count for updated group
    const { data: flashcardCount } = await this.supabase
      .from("flashcard_groups")
      .select("flashcard_id", { count: "exact" })
      .eq("group_id", command.id);

    return {
      id: updatedGroup.id,
      name: updatedGroup.name,
      description: updatedGroup.description,
      flashcard_count: flashcardCount?.length || 0,
      created_at: updatedGroup.created_at,
    };
  }

  /**
   * Deletes a group (only for admins or if no flashcards assigned)
   * @param groupId - Group ID to delete
   * @param userId - User ID for ownership validation
   * @param userRole - User role for admin check
   * @returns Promise<void>
   */
  async deleteGroup(groupId: string, userId: string, userRole: string): Promise<void> {
    // Check if group exists and belongs to user
    const { data: existingGroup, error: fetchError } = await this.supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingGroup) {
      throw {
        type: "NOT_FOUND_ERROR",
        message: "Grupa o podanym ID nie została znaleziona",
        statusCode: 404,
      };
    }

    // Check if group has assigned flashcards
    const { data: assignedFlashcards, error: countError } = await this.supabase
      .from("flashcard_groups")
      .select("flashcard_id", { count: "exact" })
      .eq("group_id", groupId);

    if (countError) {
      throw {
        type: "DATABASE_ERROR",
        message: "Błąd podczas sprawdzania przypisanych fiszek",
        details: { database: [countError.message] },
        statusCode: 500,
      };
    }

    // Only admins can delete groups with assigned flashcards
    if (assignedFlashcards && assignedFlashcards.length > 0 && userRole !== "admin") {
      throw {
        type: "CONFLICT_ERROR",
        message: "Nie można usunąć grupy - ma przypisane fiszki",
        details: { group: ["Grupa ma przypisane fiszki i może być usunięta tylko przez administratora"] },
        statusCode: 409,
      };
    }

    // Delete group (cascade will handle flashcard_groups relationships)
    const { error: deleteError } = await this.supabase.from("groups").delete().eq("id", groupId).eq("user_id", userId);

    if (deleteError) {
      throw {
        type: "DATABASE_ERROR",
        message: "Błąd podczas usuwania grupy",
        details: { database: [deleteError.message] },
        statusCode: 500,
      };
    }
  }
}
