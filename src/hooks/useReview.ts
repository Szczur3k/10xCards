import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { GeneratedFlashcardDTO, FlashcardDTO, ReviewFlashcardRequestDTO, ReviewState } from "../types";
import { useToast } from "../components/providers/ToastProvider";

export type ReviewAction = "accept" | "reject" | "edit";

interface ReviewEditData {
  front?: string;
  back?: string;
}

/**
 * API functions for review operations
 */
const reviewApi = {
  // PUT /api/flashcards/{id}/review - Convert GeneratedFlashcardDTO to FlashcardDTO
  reviewFlashcard: async (
    generatedId: string,
    action: ReviewAction,
    editData?: ReviewEditData
  ): Promise<FlashcardDTO> => {
    const request: ReviewFlashcardRequestDTO = {
      action,
      ...(editData && {
        front: editData.front,
        back: editData.back,
      }),
    };

    const response = await fetch(`/api/flashcards/${generatedId}/review`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to review flashcard: ${response.statusText}`);
    }

    return response.json();
  },
};

/**
 * useReview - Hook for managing review carousel state and operations
 * Handles navigation, version comparison, and flashcard conversion
 * Implements accept/reject/edit actions with API integration
 */
export function useReview(initialFlashcards: GeneratedFlashcardDTO[] = []) {
  const [reviewState, setReviewState] = useState<ReviewState>({
    currentIndex: 0,
    flashcards: initialFlashcards,
    previousVersions: new Map(),
    showPreviousVersion: false,
    acceptedFlashcards: [],
  });

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: ({
      generatedId,
      action,
      editData,
    }: {
      generatedId: string;
      action: ReviewAction;
      editData?: ReviewEditData;
    }) => reviewApi.reviewFlashcard(generatedId, action, editData),
    onSuccess: (convertedFlashcard, { action }) => {
      if (action === "accept") {
        // Add to accepted flashcards
        setReviewState((prev) => ({
          ...prev,
          acceptedFlashcards: [...prev.acceptedFlashcards, convertedFlashcard],
        }));

        // Invalidate flashcards cache to show new card in main grid
        queryClient.invalidateQueries({ queryKey: ["flashcards"] });

        addToast({
          type: "success",
          title: "Fiszka zaakceptowana",
          description: "Fiszka została dodana do twojej kolekcji",
        });
      }
    },
    onError: (error, { action }) => {
      addToast({
        type: "error",
        title: `Błąd podczas ${action === "accept" ? "akceptacji" : "odrzucenia"}`,
        description: error.message,
      });
    },
  });

  // Initialize review session
  const initializeReview = useCallback((flashcards: GeneratedFlashcardDTO[]) => {
    setReviewState({
      currentIndex: 0,
      flashcards,
      previousVersions: new Map(),
      showPreviousVersion: false,
      acceptedFlashcards: [],
    });
  }, []);

  // Navigation
  const goToNext = useCallback(() => {
    setReviewState((prev) => ({
      ...prev,
      currentIndex: Math.min(prev.currentIndex + 1, prev.flashcards.length - 1),
      showPreviousVersion: false,
    }));
  }, []);

  const goToPrevious = useCallback(() => {
    setReviewState((prev) => ({
      ...prev,
      currentIndex: Math.max(prev.currentIndex - 1, 0),
      showPreviousVersion: false,
    }));
  }, []);

  const goToIndex = useCallback((index: number) => {
    setReviewState((prev) => ({
      ...prev,
      currentIndex: Math.max(0, Math.min(index, prev.flashcards.length - 1)),
      showPreviousVersion: false,
    }));
  }, []);

  // Version comparison
  const toggleVersionComparison = useCallback(() => {
    setReviewState((prev) => ({
      ...prev,
      showPreviousVersion: !prev.showPreviousVersion,
    }));
  }, []);

  // Edit current flashcard
  const editCurrentFlashcard = useCallback(
    (editData: ReviewEditData) => {
      setReviewState((prev) => {
        const currentFlashcard = prev.flashcards[prev.currentIndex];
        if (!currentFlashcard) return prev;

        // Store previous version for comparison
        const previousVersions = new Map(prev.previousVersions);
        if (!previousVersions.has(currentFlashcard.id)) {
          previousVersions.set(currentFlashcard.id, { ...currentFlashcard });
        }

        // Update current flashcard
        const updatedFlashcards = [...prev.flashcards];
        updatedFlashcards[prev.currentIndex] = {
          ...currentFlashcard,
          ...editData,
        };

        return {
          ...prev,
          flashcards: updatedFlashcards,
          previousVersions,
        };
      });

      addToast({
        type: "success",
        title: "Fiszka zaktualizowana",
        description: "Zmiany zostały zapisane lokalnie",
      });
    },
    [addToast]
  );

  // Accept current flashcard
  const acceptCurrentFlashcard = useCallback(() => {
    const currentFlashcard = reviewState.flashcards[reviewState.currentIndex];
    if (!currentFlashcard) return;

    // Check if flashcard was edited
    const editData = reviewState.previousVersions.has(currentFlashcard.id)
      ? {
          front: currentFlashcard.front,
          back: currentFlashcard.back,
        }
      : undefined;

    reviewMutation.mutate({
      generatedId: currentFlashcard.id,
      action: "accept",
      editData,
    });

    // Auto-advance to next card
    if (reviewState.currentIndex < reviewState.flashcards.length - 1) {
      goToNext();
    }
  }, [reviewState, reviewMutation, goToNext]);

  // Reject current flashcard
  const rejectCurrentFlashcard = useCallback(() => {
    const currentFlashcard = reviewState.flashcards[reviewState.currentIndex];
    if (!currentFlashcard) return;

    // Remove from review queue
    setReviewState((prev) => {
      const updatedFlashcards = prev.flashcards.filter((_, index) => index !== prev.currentIndex);
      const newIndex = Math.min(prev.currentIndex, updatedFlashcards.length - 1);

      return {
        ...prev,
        flashcards: updatedFlashcards,
        currentIndex: Math.max(0, newIndex),
      };
    });

    addToast({
      type: "info",
      title: "Fiszka odrzucona",
      description: "Fiszka została usunięta z kolejki przeglądu",
    });
  }, [reviewState.currentIndex, addToast]);

  // Accept all remaining flashcards
  const acceptAllRemaining = useCallback(() => {
    const remainingFlashcards = reviewState.flashcards.slice(reviewState.currentIndex);

    if (remainingFlashcards.length === 0) return;

    // Process each flashcard
    remainingFlashcards.forEach((flashcard) => {
      const editData = reviewState.previousVersions.has(flashcard.id)
        ? {
            front: flashcard.front,
            back: flashcard.back,
          }
        : undefined;

      reviewMutation.mutate({
        generatedId: flashcard.id,
        action: "accept",
        editData,
      });
    });

    addToast({
      type: "success",
      title: `Zaakceptowano ${remainingFlashcards.length} fiszek`,
      description: "Wszystkie pozostałe fiszki zostały dodane do kolekcji",
    });
  }, [reviewState, reviewMutation, addToast]);

  // Reject all remaining flashcards
  const rejectAllRemaining = useCallback(() => {
    const remainingCount = reviewState.flashcards.length - reviewState.currentIndex;

    if (remainingCount === 0) return;

    setReviewState((prev) => ({
      ...prev,
      flashcards: prev.flashcards.slice(0, prev.currentIndex),
      currentIndex: Math.max(0, prev.currentIndex - 1),
    }));

    addToast({
      type: "info",
      title: `Odrzucono ${remainingCount} fiszek`,
      description: "Pozostałe fiszki zostały usunięte z kolejki przeglądu",
    });
  }, [reviewState, addToast]);

  // Get current flashcard
  const getCurrentFlashcard = useCallback(() => {
    return reviewState.flashcards[reviewState.currentIndex] || null;
  }, [reviewState]);

  // Get previous version of current flashcard
  const getPreviousVersion = useCallback(() => {
    const currentFlashcard = getCurrentFlashcard();
    if (!currentFlashcard) return null;

    return reviewState.previousVersions.get(currentFlashcard.id) || null;
  }, [reviewState, getCurrentFlashcard]);

  // Check if there are changes
  const hasChanges = useCallback(() => {
    const currentFlashcard = getCurrentFlashcard();
    if (!currentFlashcard) return false;

    return reviewState.previousVersions.has(currentFlashcard.id);
  }, [reviewState, getCurrentFlashcard]);

  // Clear review session
  const clearReview = useCallback(() => {
    setReviewState({
      currentIndex: 0,
      flashcards: [],
      previousVersions: new Map(),
      showPreviousVersion: false,
      acceptedFlashcards: [],
    });
  }, []);

  return {
    // State
    reviewState,
    currentFlashcard: getCurrentFlashcard(),
    previousVersion: getPreviousVersion(),
    currentIndex: reviewState.currentIndex,
    totalCards: reviewState.flashcards.length,
    acceptedCount: reviewState.acceptedFlashcards.length,
    remainingCount: reviewState.flashcards.length - reviewState.currentIndex,

    // Navigation
    goToNext,
    goToPrevious,
    goToIndex,
    canGoNext: reviewState.currentIndex < reviewState.flashcards.length - 1,
    canGoPrevious: reviewState.currentIndex > 0,

    // Version comparison
    showPreviousVersion: reviewState.showPreviousVersion,
    toggleVersionComparison,
    hasChanges: hasChanges(),

    // Actions
    initializeReview,
    editCurrentFlashcard,
    acceptCurrentFlashcard,
    rejectCurrentFlashcard,
    acceptAllRemaining,
    rejectAllRemaining,
    clearReview,

    // Status
    isProcessing: reviewMutation.isPending,
    isComplete: reviewState.flashcards.length === 0,
    isEmpty: reviewState.flashcards.length === 0 && reviewState.currentIndex === 0,
  };
}
