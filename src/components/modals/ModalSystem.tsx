import React, { createContext, useContext, useState, useCallback } from "react";
import { AIGenerationModal } from "./AIGenerationModal";
import { ReviewCarousel } from "./ReviewCarousel";
import { EditFlashcardModal } from "./EditFlashcardModal";
import type { GenerateFlashcardsRequestDTO, GeneratedFlashcardDTO } from "../../types";

// Modal types
type ModalType = "ai-generation" | "review-carousel" | "edit-flashcard" | "bulk-confirmation" | null;

interface ModalState {
  type: ModalType;
  isOpen: boolean;
  data?: unknown;
}

interface SharedModalData {
  generatedFlashcards?: GeneratedFlashcardDTO[];
  sourceTextId?: string;
  sourceText?: string;
  selectedCategories?: string[];
  selectedGroups?: string[];
}

interface ModalContextType {
  modalState: ModalState;
  sharedData: SharedModalData;
  openModal: (type: ModalType, data?: unknown) => void;
  closeModal: () => void;
  updateModalData: (data: unknown) => void;
  updateSharedData: (data: Partial<SharedModalData>) => void;
  clearSharedData: () => void;
}

// Context
const ModalContext = createContext<ModalContextType | null>(null);

// Hook for using modal context
export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within ModalProvider");
  }
  return context;
}

// Provider component
export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    isOpen: false,
    data: undefined,
  });

  const [sharedData, setSharedData] = useState<SharedModalData>({});

  const openModal = useCallback((type: ModalType, data?: unknown) => {
    setModalState({
      type,
      isOpen: true,
      data,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({
      type: null,
      isOpen: false,
      data: undefined,
    });
  }, []);

  const updateModalData = useCallback((data: unknown) => {
    setModalState((prev) => ({
      ...prev,
      data: { ...prev.data, ...data },
    }));
  }, []);

  const updateSharedData = useCallback((data: Partial<SharedModalData>) => {
    setSharedData((prev) => ({ ...prev, ...data }));
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
    clearSharedData,
  };

  return <ModalContext.Provider value={contextValue}>{children}</ModalContext.Provider>;
}

// Modal renderer component - EXPORTED
export function ModalRenderer() {
  const { modalState, sharedData, closeModal, openModal, updateSharedData } = useModal();

  // Get flashcards for review modal
  const reviewFlashcards = sharedData.generatedFlashcards || modalState.data?.flashcards || [];

  const handleAIGenerate = useCallback(
    (request: GenerateFlashcardsRequestDTO) => {
      // Store generation request data in shared data
      updateSharedData({
        sourceTextId: undefined, // Will be set by the API
        selectedCategories: request.category_ids,
        selectedGroups: request.group_ids,
      });
    },
    [updateSharedData]
  );

  const handleOpenReview = useCallback(() => {
    // Don't open review modal if it's already open
    if (modalState.type === "review-carousel" && modalState.isOpen) {
      return;
    }

    // Get generated cards from shared data
    const flashcards = sharedData.generatedFlashcards || [];
    openModal("review-carousel", { flashcards });
  }, [openModal, sharedData.generatedFlashcards, modalState.type, modalState.isOpen]);

  const handleReviewComplete = useCallback(() => {
    closeModal();
    // Trigger dashboard refresh by dispatching custom event
    window.dispatchEvent(new CustomEvent("flashcards-updated"));
  }, [closeModal]);

  const handleEditSave = useCallback(() => {
    closeModal();
    // Optionally refresh flashcards list
  }, [closeModal]);

  return (
    <>
      {/* AI Generation Modal */}
      <AIGenerationModal
        isOpen={modalState.isOpen && modalState.type === "ai-generation"}
        onClose={closeModal}
        onGenerate={handleAIGenerate}
        onOpenReview={handleOpenReview}
      />

      {/* Review Carousel Modal */}
      <ReviewCarousel
        isOpen={modalState.isOpen && modalState.type === "review-carousel"}
        flashcards={reviewFlashcards}
        onClose={closeModal}
        onComplete={handleReviewComplete}
      />

      {/* Edit Flashcard Modal */}
      <EditFlashcardModal
        isOpen={modalState.isOpen && modalState.type === "edit-flashcard"}
        flashcard={modalState.data?.flashcard}
        onClose={closeModal}
        onSave={handleEditSave}
      />

      {/* TODO: Add BulkConfirmationModal when needed */}
    </>
  );
}
