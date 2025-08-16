import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GroupDTO, CreateGroupRequestDTO } from "../types";

/**
 * Hook for managing groups
 * Provides CRUD operations and data management for group operations
 */
export function useGroups() {
  const queryClient = useQueryClient();

  // Fetch all groups
  const {
    data: groups = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["groups"],
    queryFn: async (): Promise<GroupDTO[]> => {
      const response = await fetch("/api/groups");
      if (!response.ok) {
        throw new Error("Błąd podczas ładowania grup");
      }
      const result = await response.json();
      return result.data || result; // Handle both formats
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create new group
  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupRequestDTO): Promise<GroupDTO> => {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Błąd podczas tworzenia grupy");
      }

      return response.json();
    },
    onSuccess: (newGroup) => {
      // Update groups cache
      queryClient.setQueryData(["groups"], (old: GroupDTO[] = []) => {
        return [...old, newGroup].sort((a, b) => a.name.localeCompare(b.name));
      });
    },
  });

  // Transform groups for MultiSelect component
  const groupOptions = groups.map((group) => ({
    id: group.id,
    name: group.name,
    description: group.description || undefined,
  }));

  // Create group function for MultiSelect
  const createGroup = async (name: string) => {
    const newGroup = await createGroupMutation.mutateAsync({
      name: name.trim(),
      description: undefined,
    });

    return {
      id: newGroup.id,
      name: newGroup.name,
      description: newGroup.description || undefined,
    };
  };

  // Get groups by IDs (for displaying selected groups)
  const getGroupsByIds = (ids: string[]): GroupDTO[] => {
    return groups.filter((group) => ids.includes(group.id));
  };

  return {
    // Data
    groups,
    groupOptions,

    // Loading states
    isLoading,
    isCreating: createGroupMutation.isPending,

    // Error states
    error,
    createError: createGroupMutation.error,

    // Actions
    createGroup,
    getGroupsByIds,

    // Utils
    refetch: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  };
}
