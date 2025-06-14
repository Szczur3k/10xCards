import React, { useState } from 'react';
import { Header } from './Header';
import { FlashcardGrid } from '../flashcards/FlashcardGrid';
import { BulkOperationsBar } from '../flashcards/BulkOperationsBar';
import { AIGenerationModal } from '../modals/AIGenerationModal';
import { ReviewCarousel } from '../modals/ReviewCarousel';
import { EditFlashcardModal } from '../modals/EditFlashcardModal';
import { useFlashcards } from '../../hooks/useFlashcards';
import { useFilterContext } from '../providers/FilterProvider';
import { useBulkOperations } from '../../hooks/useBulkOperations';
import { useAIGeneration } from '../../hooks/useAIGeneration';
import type { FlashcardViewModel, GenerateFlashcardsRequestDTO, FlashcardDTO } from '../../types';

/**
 * MainContent - Main content area that fills remaining space after sidebar
 * Contains header with search/actions and main content grid
 * Integrates with all data management hooks and modal system
 */
export function MainContent() {
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<FlashcardDTO | undefined>();

  const { updateSearch, toQueryParams, filters } = useFilterContext();
  const { flashcards: rawFlashcards, isLoading, deleteFlashcard } = useFlashcards(toQueryParams());
  
  // Apply client-side search filtering until API supports it
  const flashcards: FlashcardDTO[] = React.useMemo(() => {
    if (!filters.search.trim()) return rawFlashcards;
    
    const searchLower = filters.search.toLowerCase();
    return rawFlashcards.filter(flashcard => 
      flashcard.front.toLowerCase().includes(searchLower) ||
      flashcard.back.toLowerCase().includes(searchLower)
    );
  }, [rawFlashcards, filters.search]);
  const {
    selectedCount,
    isProcessing,
    currentOperation,
    toggleSelection,
    clearSelection,
    isSelected,
    executeBulkOperation
  } = useBulkOperations();
  const { generatedCards, hasResults, startGeneration, generationStatus, isGenerating } = useAIGeneration();

  // Convert flashcards to ViewModel format
  const flashcardViewModels: FlashcardViewModel[] = flashcards.map(flashcard => ({
    ...flashcard,
    selected: isSelected(flashcard.id),
    loading: false,
    isEditing: false
  }));

  const handleSearch = (query: string) => {
    updateSearch(query);
  };

  const handleGenerateAI = () => {
    setIsAIModalOpen(true);
  };

  const handleAddManual = () => {
    setEditingFlashcard(undefined); // Create mode
    setIsEditModalOpen(true);
  };

  const handleAIGenerate = (request: GenerateFlashcardsRequestDTO) => {
    // Generation is now handled directly in the modal via hook
    // This callback is kept for potential future use
  };

  const handleOpenReview = () => {
    if (hasResults) {
      setIsAIModalOpen(false);
      setIsReviewModalOpen(true);
    }
  };

  const handleReviewComplete = () => {
    setIsReviewModalOpen(false);
    // Generation cards will be added to main grid automatically via React Query
  };

  const handleCardEdit = (id: string) => {
    const flashcard = flashcards.find(f => f.id === id);
    if (flashcard) {
      setEditingFlashcard(flashcard); // Edit mode
      setIsEditModalOpen(true);
    }
  };

  const handleCardDelete = async (id: string) => {
    // Single card delete with confirmation
    const flashcard = flashcards.find(f => f.id === id);
    if (!flashcard) return;

    const confirmed = window.confirm(
      `Czy na pewno chcesz usunąć fiszkę "${flashcard.front.slice(0, 50)}${flashcard.front.length > 50 ? '...' : ''}"?`
    );

    if (confirmed) {
      try {
        await deleteFlashcard(id);
        
        // Success toast is handled by React Query
        // No need to add explicit success toast here
      } catch (error) {
        console.error('Failed to delete flashcard:', error);
        
        // Show user-friendly error message via toast
        // This will be handled by the useFlashcards hook automatically
        // through React Query onError handlers
      }
    }
  };

  const handleEditSave = (flashcard: FlashcardDTO) => {
    // Called after successful save/update
    setIsEditModalOpen(false);
    setEditingFlashcard(undefined);
  };

  const handleEditClose = () => {
    setIsEditModalOpen(false);
    setEditingFlashcard(undefined);
  };

  return (
    <>
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header with search bar and primary actions */}
        <Header 
          onSearch={handleSearch}
          onGenerateAI={handleGenerateAI}
          onAddManual={handleAddManual}
          selectedCount={selectedCount}
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

      {/* AI Generation Modal */}
      <AIGenerationModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onGenerate={handleAIGenerate}
        onOpenReview={handleOpenReview}
      />

      {/* Review Carousel Modal */}
      <ReviewCarousel
        isOpen={isReviewModalOpen}
        flashcards={generatedCards}
        onClose={() => setIsReviewModalOpen(false)}
        onComplete={handleReviewComplete}
      />

      {/* Edit/Create Flashcard Modal */}
      <EditFlashcardModal
        isOpen={isEditModalOpen}
        flashcard={editingFlashcard}
        onClose={handleEditClose}
        onSave={handleEditSave}
      />
    </>
  );
} 