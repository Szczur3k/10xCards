import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  FlashcardListResponseDTO,
  FlashcardDTO,
  FlashcardQueryParams,
  CreateFlashcardRequestDTO,
  UpdateFlashcardRequestDTO,
} from "../types";

/**
 * API functions for flashcards
 */
const flashcardsApi = {
  // GET /api/flashcards
  getFlashcards: async (params: FlashcardQueryParams = {}): Promise<FlashcardListResponseDTO> => {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.status) searchParams.set("status", params.status);
    if (params.creation_type) searchParams.set("creation_type", params.creation_type);
    if (params.category_id) searchParams.set("category_id", params.category_id);
    if (params.group_id) searchParams.set("group_id", params.group_id);
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.order) searchParams.set("order", params.order);

    const response = await fetch(`/api/flashcards?${searchParams.toString()}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch flashcards: ${response.statusText}`);
    }

    return response.json();
  },

  // POST /api/flashcards
  createFlashcard: async (data: CreateFlashcardRequestDTO): Promise<FlashcardDTO> => {
    const response = await fetch("/api/flashcards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create flashcard: ${response.statusText}`);
    }

    return response.json();
  },

  // PUT /api/flashcards/{id}
  updateFlashcard: async (id: string, data: UpdateFlashcardRequestDTO): Promise<FlashcardDTO> => {
    const response = await fetch(`/api/flashcards/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update flashcard: ${response.statusText}`);
    }

    return response.json();
  },

  // DELETE /api/flashcards/{id}
  deleteFlashcard: async (id: string): Promise<void> => {
    const response = await fetch(`/api/flashcards/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete flashcard: ${response.statusText}`);
    }
  },
};

/**
 * useFlashcards - Hook for managing flashcards with React Query
 * Provides data fetching, caching, and CRUD operations
 * Implements optimistic updates and cache invalidation
 */
export function useFlashcards(params: FlashcardQueryParams = {}) {
  const queryClient = useQueryClient();

  // Query key for caching
  const queryKey = ["flashcards", params];

  // GET flashcards query
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () => flashcardsApi.getFlashcards(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // CREATE flashcard mutation
  const createMutation = useMutation({
    mutationFn: flashcardsApi.createFlashcard,
    onSuccess: (newFlashcard) => {
      // Invalidate and refetch flashcards list
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });

      // Optionally add to cache optimistically
      queryClient.setQueryData(queryKey, (oldData: FlashcardListResponseDTO | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          data: [newFlashcard, ...oldData.data],
          pagination: {
            ...oldData.pagination,
            total: oldData.pagination.total + 1,
          },
        };
      });
    },
  });

  // UPDATE flashcard mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFlashcardRequestDTO }) =>
      flashcardsApi.updateFlashcard(id, data),
    onSuccess: (updatedFlashcard) => {
      // Update specific flashcard in cache
      queryClient.setQueryData(queryKey, (oldData: FlashcardListResponseDTO | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          data: oldData.data.map((flashcard) => (flashcard.id === updatedFlashcard.id ? updatedFlashcard : flashcard)),
        };
      });
    },
  });

  // DELETE flashcard mutation
  const deleteMutation = useMutation({
    mutationFn: flashcardsApi.deleteFlashcard,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.setQueryData(queryKey, (oldData: FlashcardListResponseDTO | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          data: oldData.data.filter((flashcard) => flashcard.id !== deletedId),
          pagination: {
            ...oldData.pagination,
            total: oldData.pagination.total - 1,
          },
        };
      });
    },
  });

  return {
    // Data
    flashcards: data?.data || [],
    pagination: data?.pagination,

    // Loading states
    isLoading,
    isFetching,

    // Error state
    error,

    // Actions
    refetch,
    createFlashcard: createMutation.mutate,
    updateFlashcard: updateMutation.mutate,
    deleteFlashcard: deleteMutation.mutate,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Mutation errors
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}
