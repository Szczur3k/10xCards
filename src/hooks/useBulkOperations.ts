import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BulkOperationState, FlashcardStatus } from "../types";
import { useToast } from "../components/providers/ToastProvider";

/**
 * Bulk operation types
 */
export type BulkOperationType = "delete" | "change_status" | "assign_categories" | "assign_groups";

/**
 * Bulk operation request data
 */
interface BulkOperationRequest {
  flashcard_ids: string[];
  operation: BulkOperationType;
  data?: {
    status?: FlashcardStatus;
    category_ids?: string[];
    group_ids?: string[];
  };
}

/**
 * API functions for bulk operations
 */
const bulkOperationsApi = {
  // DELETE multiple flashcards
  bulkDelete: async (flashcard_ids: string[]): Promise<void> => {
    const response = await fetch("/api/flashcards/bulk", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ flashcard_ids }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete flashcards: ${response.statusText}`);
    }
  },

  // PUT bulk status change
  bulkChangeStatus: async (flashcard_ids: string[], status: FlashcardStatus): Promise<void> => {
    const response = await fetch("/api/flashcards/bulk", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        flashcard_ids,
        operation: "change_status",
        data: { status },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to change status: ${response.statusText}`);
    }
  },

  // PUT bulk assign categories
  bulkAssignCategories: async (flashcard_ids: string[], category_ids: string[]): Promise<void> => {
    const response = await fetch("/api/flashcards/bulk", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        flashcard_ids,
        operation: "assign_categories",
        data: { category_ids },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to assign categories: ${response.statusText}`);
    }
  },

  // PUT bulk assign groups
  bulkAssignGroups: async (flashcard_ids: string[], group_ids: string[]): Promise<void> => {
    const response = await fetch("/api/flashcards/bulk", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        flashcard_ids,
        operation: "assign_groups",
        data: { group_ids },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to assign groups: ${response.statusText}`);
    }
  },
};

/**
 * useBulkOperations - Hook for managing bulk operations on flashcards
 * Provides selection state management and batch processing
 * Implements progress tracking and error handling
 */
export function useBulkOperations() {
  const [bulkState, setBulkState] = useState<BulkOperationState>({
    selectedIds: [],
    operation: undefined,
    isProcessing: false,
    progress: 0,
  });

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  // Toggle single flashcard selection
  const toggleSelection = useCallback((id: string) => {
    setBulkState((prev) => ({
      ...prev,
      selectedIds: prev.selectedIds.includes(id)
        ? prev.selectedIds.filter((selectedId) => selectedId !== id)
        : [...prev.selectedIds, id],
    }));
  }, []);

  // Select all flashcards
  const selectAll = useCallback((ids: string[]) => {
    setBulkState((prev) => ({
      ...prev,
      selectedIds: ids,
    }));
  }, []);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setBulkState((prev) => ({
      ...prev,
      selectedIds: [],
      operation: undefined,
    }));
  }, []);

  // Check if flashcard is selected
  const isSelected = useCallback(
    (id: string) => {
      return bulkState.selectedIds.includes(id);
    },
    [bulkState.selectedIds]
  );

  // Bulk delete mutation
  const deleteMutation = useMutation({
    mutationFn: bulkOperationsApi.bulkDelete,
    onMutate: () => {
      setBulkState((prev) => ({ ...prev, isProcessing: true, operation: "delete" }));
    },
    onSuccess: () => {
      // Invalidate flashcards cache
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });

      addToast({
        type: "success",
        title: `Usunięto ${bulkState.selectedIds.length} fiszek`,
      });

      clearSelection();
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: `Błąd podczas usuwania: ${error.message}`,
      });
    },
    onSettled: () => {
      setBulkState((prev) => ({ ...prev, isProcessing: false, progress: 0 }));
    },
  });

  // Bulk status change mutation
  const changeStatusMutation = useMutation({
    mutationFn: ({ status }: { status: FlashcardStatus }) =>
      bulkOperationsApi.bulkChangeStatus(bulkState.selectedIds, status),
    onMutate: () => {
      setBulkState((prev) => ({ ...prev, isProcessing: true, operation: "change_status" }));
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });

      const statusLabels: Record<FlashcardStatus, string> = {
        draft: "szkic",
        published: "opublikowane",
        archived: "zarchiwizowane",
      };

      addToast({
        type: "success",
        title: `Zmieniono status ${bulkState.selectedIds.length} fiszek na "${statusLabels[status]}"`,
      });

      clearSelection();
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: `Błąd podczas zmiany statusu: ${error.message}`,
      });
    },
    onSettled: () => {
      setBulkState((prev) => ({ ...prev, isProcessing: false, progress: 0 }));
    },
  });

  // Bulk assign categories mutation
  const assignCategoriesMutation = useMutation({
    mutationFn: ({ category_ids }: { category_ids: string[] }) =>
      bulkOperationsApi.bulkAssignCategories(bulkState.selectedIds, category_ids),
    onMutate: () => {
      setBulkState((prev) => ({ ...prev, isProcessing: true, operation: "assign_categories" }));
    },
    onSuccess: (_, { category_ids }) => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });

      addToast({
        type: "success",
        title: `Przypisano kategorie do ${bulkState.selectedIds.length} fiszek`,
      });

      clearSelection();
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: `Błąd podczas przypisywania kategorii: ${error.message}`,
      });
    },
    onSettled: () => {
      setBulkState((prev) => ({ ...prev, isProcessing: false, progress: 0 }));
    },
  });

  // Bulk assign groups mutation
  const assignGroupsMutation = useMutation({
    mutationFn: ({ group_ids }: { group_ids: string[] }) =>
      bulkOperationsApi.bulkAssignGroups(bulkState.selectedIds, group_ids),
    onMutate: () => {
      setBulkState((prev) => ({ ...prev, isProcessing: true, operation: "assign_groups" }));
    },
    onSuccess: (_, { group_ids }) => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });

      addToast({
        type: "success",
        title: `Przypisano grupy do ${bulkState.selectedIds.length} fiszek`,
      });

      clearSelection();
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: `Błąd podczas przypisywania grup: ${error.message}`,
      });
    },
    onSettled: () => {
      setBulkState((prev) => ({ ...prev, isProcessing: false, progress: 0 }));
    },
  });

  // Execute bulk operation
  const executeBulkOperation = useCallback(
    (
      operation: BulkOperationType,
      data?: { status?: FlashcardStatus; category_ids?: string[]; group_ids?: string[] }
    ) => {
      if (bulkState.selectedIds.length === 0) {
        addToast({
          type: "warning",
          title: "Nie wybrano żadnych fiszek",
        });
        return;
      }

      switch (operation) {
        case "delete":
          deleteMutation.mutate(bulkState.selectedIds);
          break;
        case "change_status":
          if (data?.status) {
            changeStatusMutation.mutate({ status: data.status });
          }
          break;
        case "assign_categories":
          if (data?.category_ids) {
            assignCategoriesMutation.mutate({ category_ids: data.category_ids });
          }
          break;
        case "assign_groups":
          if (data?.group_ids) {
            assignGroupsMutation.mutate({ group_ids: data.group_ids });
          }
          break;
      }
    },
    [
      bulkState.selectedIds,
      deleteMutation,
      changeStatusMutation,
      assignCategoriesMutation,
      assignGroupsMutation,
      addToast,
    ]
  );

  return {
    // Selection state
    selectedIds: bulkState.selectedIds,
    selectedCount: bulkState.selectedIds.length,
    hasSelection: bulkState.selectedIds.length > 0,

    // Processing state
    isProcessing: bulkState.isProcessing,
    currentOperation: bulkState.operation,
    progress: bulkState.progress,

    // Selection actions
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,

    // Bulk operations
    executeBulkOperation,

    // Individual operation states
    isDeleting: deleteMutation.isPending,
    isChangingStatus: changeStatusMutation.isPending,
    isAssigningCategories: assignCategoriesMutation.isPending,
    isAssigningGroups: assignGroupsMutation.isPending,
  };
}
