import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  X, 
  ChevronLeft, 
  ChevronRight,
  Check,
  X as XIcon,
  Edit3,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useReview } from '../../hooks/useReview';
import type { GeneratedFlashcardDTO } from '../../types';

interface ReviewCarouselProps {
  isOpen: boolean;
  flashcards: GeneratedFlashcardDTO[];
  onClose: () => void;
  onComplete?: () => void;
}

/**
 * ReviewCarousel - Modal carousel for reviewing AI-generated flashcards
 * Provides navigation, editing, and accept/reject actions
 * Implements version comparison and bulk operations
 */
export function ReviewCarousel({ 
  isOpen, 
  flashcards, 
  onClose,
  onComplete 
}: ReviewCarouselProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');

  const {
    initializeReview,
    currentFlashcard,
    previousVersion,
    currentIndex,
    totalCards,
    acceptedCount,
    remainingCount,
    goToNext,
    goToPrevious,
    canGoNext,
    canGoPrevious,
    showPreviousVersion,
    toggleVersionComparison,
    hasChanges,
    editCurrentFlashcard,
    acceptCurrentFlashcard,
    rejectCurrentFlashcard,
    acceptAllRemaining,
    rejectAllRemaining,
    clearReview,
    isProcessing,
    isComplete,
    isEmpty
  } = useReview(flashcards);

  // Initialize review when modal opens
  React.useEffect(() => {
    if (isOpen && flashcards.length > 0) {
      initializeReview(flashcards);
    }
  }, [isOpen, flashcards, initializeReview]);

  // Initialize edit form when flashcard changes
  React.useEffect(() => {
    if (currentFlashcard) {
      setEditFront(currentFlashcard.front);
      setEditBack(currentFlashcard.back);
    }
  }, [currentFlashcard]);

  // Handle completion
  React.useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  if (!isOpen) return null;

  if (isEmpty) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-background border border-border rounded-lg shadow-xl max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Przegląd zakończony!</h3>
          <p className="text-muted-foreground mb-6">
            Wszystkie fiszki zostały przetworzone. Zaakceptowane fiszki znajdziesz w głównej kolekcji.
          </p>
          <Button onClick={onClose} className="w-full">
            Zamknij
          </Button>
        </div>
      </div>
    );
  }

  if (!currentFlashcard) return null;

  const handleEdit = () => {
    if (isEditing) {
      // Save changes
      editCurrentFlashcard({
        front: editFront.trim(),
        back: editBack.trim()
      });
    } else {
      // Reset edit form
      setEditFront(currentFlashcard.front);
      setEditBack(currentFlashcard.back);
    }
    setIsEditing(!isEditing);
  };

  const handleAccept = () => {
    if (isEditing) {
      // Save changes first
      editCurrentFlashcard({
        front: editFront.trim(),
        back: editBack.trim()
      });
      setIsEditing(false);
    }
    acceptCurrentFlashcard();
  };

  const handleReject = () => {
    if (isEditing) {
      setIsEditing(false);
    }
    rejectCurrentFlashcard();
  };

  const displayFlashcard = showPreviousVersion && previousVersion ? previousVersion : currentFlashcard;
  const displayFront = isEditing ? editFront : displayFlashcard.front;
  const displayBack = isEditing ? editBack : displayFlashcard.back;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold">Przegląd fiszek AI</h2>
              <p className="text-sm text-muted-foreground">
                Fiszka {currentIndex + 1} z {totalCards} • 
                Zaakceptowano: {acceptedCount} • 
                Pozostało: {remainingCount}
              </p>
            </div>
            
            {/* Progress Bar */}
            <div className="flex-1 max-w-xs">
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Version Comparison Toggle */}
            {hasChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleVersionComparison}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {showPreviousVersion ? 'Pokaż nową' : 'Pokaż oryginalną'}
              </Button>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              clearReview();
              onClose();
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Card Display */}
        <div className="p-8 flex-1">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {showBack ? 'Tył' : 'Przód'}
                  </span>
                  {showPreviousVersion && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      Wersja oryginalna
                    </span>
                  )}
                  {hasChanges && !showPreviousVersion && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Zmodyfikowana
                    </span>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBack(!showBack)}
                  className="gap-2"
                >
                  {showBack ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showBack ? 'Ukryj tył' : 'Pokaż tył'}
                </Button>
              </div>

              {/* Card Content */}
              <div className="space-y-4">
                {/* Front */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Przód fiszki
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editFront}
                      onChange={(e) => setEditFront(e.target.value)}
                      className="w-full h-24 px-3 py-2 border border-border rounded-md resize-none text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Przód fiszki..."
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-md min-h-[96px] flex items-center">
                      <p className="text-sm whitespace-pre-wrap">{displayFront}</p>
                    </div>
                  )}
                </div>

                {/* Back */}
                {(showBack || isEditing) && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Tył fiszki
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editBack}
                        onChange={(e) => setEditBack(e.target.value)}
                        className="w-full h-24 px-3 py-2 border border-border rounded-md resize-none text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Tył fiszki..."
                      />
                    ) : (
                      <div className="p-3 bg-muted/50 rounded-md min-h-[96px] flex items-center">
                        <p className="text-sm whitespace-pre-wrap">{displayBack}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation and Actions */}
        <div className="border-t border-border p-6">
          <div className="flex items-center justify-between">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevious}
                disabled={!canGoPrevious || isProcessing}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Poprzednia
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                disabled={!canGoNext || isProcessing}
                className="gap-2"
              >
                Następna
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Main Actions */}
            <div className="flex items-center gap-3">
              {/* Edit Button */}
              <Button
                variant="outline"
                onClick={handleEdit}
                disabled={isProcessing}
                className="gap-2"
              >
                <Edit3 className="w-4 h-4" />
                {isEditing ? 'Zapisz zmiany' : 'Edytuj'}
              </Button>

              {/* Reject Button */}
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isProcessing}
                className="gap-2 text-destructive hover:text-destructive"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XIcon className="w-4 h-4" />
                )}
                Odrzuć
              </Button>

              {/* Accept Button */}
              <Button
                onClick={handleAccept}
                disabled={isProcessing}
                className="gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Akceptuj
              </Button>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={rejectAllRemaining}
                disabled={isProcessing || remainingCount === 0}
                className="text-destructive hover:text-destructive"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Odrzuć wszystkie
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={acceptAllRemaining}
                disabled={isProcessing || remainingCount === 0}
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Akceptuj wszystkie
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 