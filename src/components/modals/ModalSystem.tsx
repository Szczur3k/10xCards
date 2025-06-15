import React, { createContext, useContext, useState, useCallback } from 'react';
import { AIGenerationModal } from './AIGenerationModal';
import { ReviewCarousel } from './ReviewCarousel';
import { EditFlashcardModal } from './EditFlashcardModal';
import type { 
  GenerateFlashcardsRequestDTO, 
  GeneratedFlashcardDTO, 
  FlashcardDTO 
} from '../../types';

// Modal types
type ModalType = 'ai-generation' | 'review-carousel' | 'edit-flashcard' | 'bulk-confirmation' | null;

interface ModalState {
  type: ModalType;
  isOpen: boolean;
  data?: any;
}

interface SharedModalData {
  generatedFlashcards?: GeneratedFlashcardDTO[];
  sourceTextId?: string;
  selectedCategories?: string[];
  selectedGroups?: string[];
}

interface ModalContextType {
  modalState: ModalState;
  sharedData: SharedModalData;
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
  updateModalData: (data: any) => void;
  updateSharedData: (data: Partial<SharedModalData>) => void;
  clearSharedData: () => void;
}

// Context
const ModalContext = createContext<ModalContextType | null>(null);

// Hook for using modal context
export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
}

// Provider component
export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    isOpen: false,
    data: undefined
  });

  const [sharedData, setSharedData] = useState<SharedModalData>({});

  const openModal = useCallback((type: ModalType, data?: any) => {
    setModalState({
      type,
      isOpen: true,
      data
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({
      type: null,
      isOpen: false,
      data: undefined
    });
  }, []);

  const updateModalData = useCallback((data: any) => {
    setModalState(prev => ({
      ...prev,
      data: { ...prev.data, ...data }
    }));
  }, []);

  const updateSharedData = useCallback((data: Partial<SharedModalData>) => {
    setSharedData(prev => ({ ...prev, ...data }));
  }, []);

  const clearSharedData = useCallback(() => {
    setSharedData({});
  }, []);

  const contextValue: ModalContextType = {
    modalState,
    sharedData,
    openModal,
    closeModal,
    updateModalData,
    updateSharedData,
    clearSharedData
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  );
}

// Modal renderer component - EXPORTED
export function ModalRenderer() {
  const { modalState, sharedData, closeModal, openModal, updateModalData, updateSharedData } = useModal();

  const handleAIGenerate = useCallback((request: GenerateFlashcardsRequestDTO) => {
    // Store generation request data in shared data
    updateSharedData({
      sourceTextId: undefined, // Will be set by the API
      selectedCategories: request.category_ids,
      selectedGroups: request.group_ids
    });
    console.log('AI Generation request:', request);
  }, [updateSharedData]);

  const handleOpenReview = useCallback(() => {
    // Get generated cards from shared data
    const flashcards = sharedData.generatedFlashcards || [];
    console.log('Opening review modal with flashcards:', flashcards);
    openModal('review-carousel', { flashcards });
  }, [openModal, sharedData.generatedFlashcards]);

  const handleReviewComplete = useCallback(() => {
    closeModal();
    // Optionally refresh flashcards list or show success message
  }, [closeModal]);

  const handleEditSave = useCallback((flashcard: FlashcardDTO) => {
    closeModal();
    // Optionally refresh flashcards list
  }, [closeModal]);

  return (
    <>
      {/* AI Generation Modal */}
      <AIGenerationModal
        isOpen={modalState.isOpen && modalState.type === 'ai-generation'}
        onClose={closeModal}
        onGenerate={handleAIGenerate}
        onOpenReview={handleOpenReview}
      />

      {/* Review Carousel Modal */}
      <ReviewCarousel
        isOpen={modalState.isOpen && modalState.type === 'review-carousel'}
        flashcards={modalState.data?.flashcards || sharedData.generatedFlashcards || []}
        onClose={closeModal}
        onComplete={handleReviewComplete}
      />

      {/* Edit Flashcard Modal */}
      <EditFlashcardModal
        isOpen={modalState.isOpen && modalState.type === 'edit-flashcard'}
        flashcard={modalState.data?.flashcard}
        onClose={closeModal}
        onSave={handleEditSave}
      />

      {/* TODO: Add BulkConfirmationModal when needed */}
    </>
  );
}

 