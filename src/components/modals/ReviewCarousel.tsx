import React, { useState, useCallback, useEffect } from "react";
import { Button } from "../ui/button";
import { X, ChevronLeft, ChevronRight, Check, RotateCcw, Save, Trash2 } from "lucide-react";
import { useModal } from "./ModalSystem";
import { useToast } from "../providers/ToastProvider";
import { parseApiError, handleError } from "../../lib/services/error-handler.service";
import type { GeneratedFlashcardDTO } from "../../types";

interface ReviewCarouselProps {
  isOpen: boolean;
  flashcards: GeneratedFlashcardDTO[];
  onClose: () => void;
  onComplete: () => void;
}

/**
 * ReviewCarousel - Modal for reviewing generated flashcards
 * Allows users to review, edit, and accept/reject flashcards
 * Implements carousel navigation and bulk actions
 */
export function ReviewCarousel({ isOpen, flashcards, onClose, onComplete }: ReviewCarouselProps) {
  // All hooks must be called before any conditional returns
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [acceptedCards, setAcceptedCards] = useState<Set<string>>(new Set());
  const [rejectedCards, setRejectedCards] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [localFlashcards, setLocalFlashcards] = useState<GeneratedFlashcardDTO[]>(flashcards);

  const { sharedData, clearSharedData } = useModal();
  const { addToast } = useToast();

  // Synchronize local flashcards with prop changes
  useEffect(() => {
    setLocalFlashcards(flashcards);
  }, [flashcards]);

  // Safe access to current card and counts
  const totalCards = localFlashcards.length;
  const currentCard = localFlashcards[currentIndex] || localFlashcards[0];
  const acceptedCount = acceptedCards.size;
  const rejectedCount = rejectedCards.size;

  const handleNext = useCallback(() => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, totalCards]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  const handleAccept = useCallback(() => {
    if (!currentCard) return;
    const cardId = currentCard.id;
    setAcceptedCards((prev) => new Set(prev).add(cardId));
    setRejectedCards((prev) => {
      const newSet = new Set(prev);
      newSet.delete(cardId);
      return newSet;
    });

    // Auto-advance to next card
    if (currentIndex < totalCards - 1) {
      handleNext();
    }
  }, [currentCard?.id, currentIndex, totalCards, handleNext]);

  const handleReject = useCallback(() => {
    if (!currentCard) return;
    const cardId = currentCard.id;
    setRejectedCards((prev) => new Set(prev).add(cardId));
    setAcceptedCards((prev) => {
      const newSet = new Set(prev);
      newSet.delete(cardId);
      return newSet;
    });

    // Auto-advance to next card
    if (currentIndex < totalCards - 1) {
      handleNext();
    }
  }, [currentCard?.id, currentIndex, totalCards, handleNext]);

  const handleRegenerate = useCallback(async () => {
    if (!currentCard) return;

    setIsSaving(true);

    // KROK 1: Stwórz tymczasową fiszkę z tekstem ładowania
    const tempCard = {
      ...currentCard,
      front: "🔄 Regeneruję pytanie...",
      back: "🔄 Regeneruję odpowiedź...",
    };

    // KROK 2: Nadpisz aktualną fiszkę tymczasową
    const tempFlashcards = [...localFlashcards];
    tempFlashcards[currentIndex] = tempCard;
    setLocalFlashcards(tempFlashcards);

    try {
      const response = await fetch("/api/flashcards/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_text: sharedData.sourceText || "Tekst źródłowy",
          rejected_flashcard: {
            front: currentCard.front,
            back: currentCard.back,
          },
          category_ids: sharedData.selectedCategories,
          group_ids: sharedData.selectedGroups,
        }),
      });

      if (!response.ok) {
        const errorMessage = await parseApiError(response);
        throw new Error(errorMessage);
      }

      const result = await response.json();

      // KROK 3: Nadpisz tymczasową fiszkę prawdziwymi danymi
      const finalFlashcards = [...tempFlashcards];
      const finalCard = {
        ...result.flashcard,
        id: currentCard.id, // Preserve original ID to maintain status
      };
      finalFlashcards[currentIndex] = finalCard;

      // Update local state
      setLocalFlashcards(finalFlashcards);

      // Reset card status to pending (remove from rejected)
      setRejectedCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(currentCard.id);
        return newSet;
      });

      addToast({
        type: "success",
        title: "Fiszka zregenerowana!",
        description: "Wygenerowano nową wersję fiszki.",
      });
    } catch (error) {
      console.error("Error regenerating flashcard:", error);

      // W przypadku błędu, przywróć oryginalną fiszkę
      const restoredFlashcards = [...localFlashcards];
      restoredFlashcards[currentIndex] = currentCard;
      setLocalFlashcards(restoredFlashcards);

      const errorMessage = handleError(error);
      addToast({
        type: "error",
        title: "Błąd regeneracji",
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  }, [currentCard, currentIndex, localFlashcards, sharedData, addToast]);

  const handleAcceptAll = useCallback(() => {
    const allIds = localFlashcards.map((card) => card.id);
    setAcceptedCards(new Set(allIds));
    setRejectedCards(new Set());
  }, [localFlashcards]);

  const handleRejectAll = useCallback(() => {
    const allIds = localFlashcards.map((card) => card.id);
    setRejectedCards(new Set(allIds));
    setAcceptedCards(new Set());
  }, [localFlashcards]);

  const handleSave = useCallback(async () => {
    if (acceptedCards.size === 0) {
      addToast({
        type: "warning",
        title: "Brak zaakceptowanych fiszek",
        description: "Musisz zaakceptować przynajmniej jedną fiszkę przed zapisaniem.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const acceptedFlashcards = localFlashcards.filter((card) => acceptedCards.has(card.id));

      // Prepare request data for accept API
      const requestData = {
        flashcards: acceptedFlashcards.map((card) => ({
          front: card.front,
          back: card.back,
          temp_id: card.id,
        })),
        category_ids: sharedData.selectedCategories,
        group_ids: sharedData.selectedGroups,
      };

      const response = await fetch("/api/flashcards/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorMessage = await parseApiError(response);
        throw new Error(errorMessage);
      }

      const result = await response.json();

      addToast({
        type: "success",
        title: "Fiszki zapisane!",
        description: `Pomyślnie zapisano ${result.accepted_count} fiszek.`,
      });

      // Clear shared data and complete
      clearSharedData();
      onComplete();
    } catch (error) {
      console.error("Error saving flashcards:", error);
      const errorMessage = handleError(error);
      addToast({
        type: "error",
        title: "Błąd zapisywania",
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  }, [acceptedCards, localFlashcards, sharedData, addToast, clearSharedData, onComplete]);

  const getCardStatus = (cardId: string) => {
    if (acceptedCards.has(cardId)) return "accepted";
    if (rejectedCards.has(cardId)) return "rejected";
    return "pending";
  };

  // Conditional rendering after all hooks
  if (!isOpen || localFlashcards.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Przegląd wygenerowanych fiszek</h2>
            <p className="text-sm text-muted-foreground">
              Fiszka {currentIndex + 1} z {totalCards} • Zaakceptowane: {acceptedCount} • Odrzucone: {rejectedCount}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Card Display */}
        <div className="p-6 flex-1">
          <div className="max-w-2xl mx-auto">
            {/* Card */}
            <div
              className="relative w-full h-64 mb-6 cursor-pointer"
              onClick={handleFlip}
              onKeyDown={(e) => e.key === "Enter" && handleFlip()}
              role="button"
              tabIndex={0}
              aria-label="Obróć fiszkę"
            >
              <div
                className={`absolute inset-0 w-full h-full transition-transform duration-500 preserve-3d ${isFlipped ? "rotate-y-180" : ""}`}
              >
                {/* Front */}
                <div className="absolute inset-0 w-full h-full backface-hidden">
                  <div className="w-full h-full bg-card border border-border rounded-lg p-6 flex items-center justify-center shadow-lg">
                    <div className="text-center">
                      <p className="text-lg font-medium mb-2">{currentCard.front}</p>
                      <p className="text-sm text-muted-foreground">Kliknij aby obrócić</p>
                    </div>
                  </div>
                </div>

                {/* Back */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                  <div className="w-full h-full bg-card border border-border rounded-lg p-6 flex items-center justify-center shadow-lg">
                    <div className="text-center">
                      <p className="text-lg font-medium mb-2">{currentCard.back}</p>
                      <p className="text-sm text-muted-foreground">Kliknij aby obrócić</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Status */}
            <div className="text-center mb-6">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  getCardStatus(currentCard.id) === "accepted"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : getCardStatus(currentCard.id) === "rejected"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {getCardStatus(currentCard.id) === "accepted" && <Check className="w-4 h-4" />}
                {getCardStatus(currentCard.id) === "rejected" && <X className="w-4 h-4" />}
                {getCardStatus(currentCard.id) === "pending" && <RotateCcw className="w-4 h-4" />}
                {getCardStatus(currentCard.id) === "accepted"
                  ? "Zaakceptowana"
                  : getCardStatus(currentCard.id) === "rejected"
                    ? "Odrzucona"
                    : "Oczekuje"}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0} className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                Poprzednia
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleReject} className="gap-2 text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                  Odrzuć
                </Button>
                {getCardStatus(currentCard.id) === "rejected" && (
                  <Button
                    variant="outline"
                    onClick={handleRegenerate}
                    disabled={isSaving}
                    className="gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <RotateCcw className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`} />
                    {isSaving ? "Regeneruję..." : "Regeneruj"}
                  </Button>
                )}
                <Button onClick={handleAccept} className="gap-2 bg-green-600 hover:bg-green-700">
                  <Check className="w-4 h-4" />
                  Akceptuj
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentIndex === totalCards - 1}
                className="gap-2"
              >
                Następna
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-border">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleAcceptAll} className="gap-2">
              <Check className="w-4 h-4" />
              Akceptuj wszystkie
            </Button>
            <Button variant="outline" onClick={handleRejectAll} className="gap-2 text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
              Odrzuć wszystkie
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                console.log("Anuluj clicked, calling onClose");
                onClose();
              }}
            >
              Anuluj
            </Button>
            <Button onClick={handleSave} disabled={acceptedCards.size === 0 || isSaving} className="gap-2">
              {isSaving ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? "Zapisywanie..." : `Zapisz fiszki (${acceptedCount})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
