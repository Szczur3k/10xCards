import React, { useEffect } from "react";
import { Header } from "./Header";
import { FlashcardGrid } from "../flashcards/FlashcardGrid";
import { BulkOperationsBar } from "../flashcards/BulkOperationsBar";
import { useFlashcards } from "../../hooks/useFlashcards";
import { useFilterContext } from "../providers/FilterProvider";
import { useBulkOperations } from "../../hooks/useBulkOperations";
import { useModal } from "../modals/ModalSystem";
import type { FlashcardViewModel, FlashcardDTO } from "../../types";

/**
 * MainContent - Main content area that fills remaining space after sidebar
 * Contains header with search/actions and main content grid
 * Integrates with centralized modal system
 */
export function MainContent() {
  const { updateSearch, toQueryParams, filters } = useFilterContext();
  const { flashcards: rawFlashcards, isLoading, deleteFlashcard, refetch } = useFlashcards(toQueryParams());
  const { openModal } = useModal();

  // Listen for flashcards updates from modal system
  useEffect(() => {
    const handleFlashcardsUpdated = () => {
      refetch();
    };

    window.addEventListener("flashcards-updated", handleFlashcardsUpdated);
    return () => {
      window.removeEventListener("flashcards-updated", handleFlashcardsUpdated);
    };
  }, [refetch]);

  // Apply client-side search filtering until API supports it
  const flashcards: FlashcardDTO[] = React.useMemo(() => {
    if (!filters.search.trim()) return rawFlashcards;

    const searchLower = filters.search.toLowerCase();
    return rawFlashcards.filter(
      (flashcard) =>
        flashcard.front.toLowerCase().includes(searchLower) || flashcard.back.toLowerCase().includes(searchLower)
    );
  }, [rawFlashcards, filters.search]);

  const {
    selectedCount,
    isProcessing,
    currentOperation,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    executeBulkOperation,
  } = useBulkOperations();

  // Convert flashcards to ViewModel format
  const flashcardViewModels: FlashcardViewModel[] = flashcards.map((flashcard) => ({
    ...flashcard,
    selected: isSelected(flashcard.id),
    loading: false,
    isEditing: false,
  }));

  const handleSearch = (query: string) => {
    updateSearch(query);
  };

  const handleGenerateAI = () => {
    openModal("ai-generation");
  };

  const handleAddManual = () => {
    openModal("edit-flashcard"); // Create mode (no flashcard data)
  };

  const handleCardEdit = (id: string) => {
    const flashcard = flashcards.find((f) => f.id === id);
    if (flashcard) {
      openModal("edit-flashcard", { flashcard }); // Edit mode
    }
  };

  const handleCardDelete = async (id: string) => {
    // Single card delete with confirmation
    const flashcard = flashcards.find((f) => f.id === id);
    if (!flashcard) return;

    const confirmed = window.confirm(
      `Czy na pewno chcesz usunąć fiszkę "${flashcard.front.slice(0, 50)}${flashcard.front.length > 50 ? "..." : ""}"?`
    );

    if (confirmed) {
      try {
        await deleteFlashcard(id);
      } catch (error) {
        console.error("Failed to delete flashcard:", error);
      }
    }
  };

  const handleSelectAll = () => {
    const allIds = flashcards.map((f) => f.id);
    selectAll(allIds);
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Header with search bar and primary actions */}
      <Header
        onSearch={handleSearch}
        onGenerateAI={handleGenerateAI}
        onAddManual={handleAddManual}
        selectedCount={selectedCount}
        totalCount={flashcards.length}
        onSelectAll={handleSelectAll}
      />

      {/* Main content area with FlashcardGrid */}
      <div className="flex-1 overflow-auto">
        <FlashcardGrid
          flashcards={flashcardViewModels}
          loading={isLoading}
          onCardSelect={toggleSelection}
          onCardEdit={handleCardEdit}
          onCardDelete={handleCardDelete}
        />
      </div>

      {/* Bulk Operations Bar - Shows when cards are selected */}
      <BulkOperationsBar
        selectedCount={selectedCount}
        isProcessing={isProcessing}
        currentOperation={currentOperation}
        onBulkOperation={executeBulkOperation}
        onClearSelection={clearSelection}
      />
    </main>
  );
}
