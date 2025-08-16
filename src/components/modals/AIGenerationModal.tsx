import React, { useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { MultiSelect } from "../ui/multi-select";
import { X, Sparkles, FileText, Hash, Tag, Users, Zap, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useAIGeneration } from "../../hooks/useAIGeneration";
import { useCategories } from "../../hooks/useCategories";
import { useGroups } from "../../hooks/useGroups";
import { useModal } from "./ModalSystem";
import type { GenerateFlashcardsRequestDTO } from "../../types";

interface AIGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (request: GenerateFlashcardsRequestDTO) => void;
  onOpenReview?: () => void;
}

/**
 * AIGenerationModal - Simplified AI flashcard generation modal
 * Focuses on form input and basic generation flow
 * Communicates completion through props callbacks
 */
export function AIGenerationModal({ isOpen, onClose, onGenerate, onOpenReview }: AIGenerationModalProps) {
  const [sourceText, setSourceText] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [maxCards, setMaxCards] = useState(10);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [reviewOpened, setReviewOpened] = useState(false);

  const { updateSharedData } = useModal();

  const {
    availableModels,
    defaultModel,
    isLoadingModels,
    validateSourceText,
    isGenerating,
    generationStatus,
    hasResults,
    generatedCards,
    startGeneration,
    cancelGeneration,
    clearResults,
  } = useAIGeneration();

  const resetForm = useCallback(() => {
    setSourceText("");
    setSelectedModel(defaultModel?.id || "");
    setMaxCards(10);
    setSelectedCategories([]);
    setSelectedGroups([]);
    setReviewOpened(false);
  }, [defaultModel]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const { categoryOptions, isLoading: isLoadingCategories, createCategory } = useCategories();

  const { groupOptions, isLoading: isLoadingGroups, createGroup } = useGroups();

  // Set default model when models load
  useEffect(() => {
    if (defaultModel && !selectedModel) {
      setSelectedModel(defaultModel.id);
    }
  }, [defaultModel, selectedModel]);

  // Handle generation completion - save to shared data and call onOpenReview
  useEffect(() => {
    if (generationStatus === "completed" && hasResults && onOpenReview && !reviewOpened) {
      // Save generated cards to shared modal data
      if (generatedCards && generatedCards.length > 0) {
        updateSharedData({
          generatedFlashcards: generatedCards,
          sourceText: sourceText.trim(),
          selectedCategories,
          selectedGroups,
        });
      }
      setReviewOpened(true);
      onOpenReview();
    }
  }, [
    generationStatus,
    hasResults,
    onOpenReview,
    generatedCards,
    updateSharedData,
    selectedCategories,
    selectedGroups,
    reviewOpened,
  ]);

  if (!isOpen) return null;

  const sourceTextValidation = validateSourceText(sourceText);
  const characterCount = sourceText.length;
  const isFormValid = sourceTextValidation.isValid && selectedModel && maxCards >= 1 && maxCards <= 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) return;

    const request: GenerateFlashcardsRequestDTO = {
      source_text: sourceText.trim(),
      max_flashcards: maxCards,
      model: selectedModel,
      category_ids: selectedCategories.length > 0 ? selectedCategories : undefined,
      group_ids: selectedGroups.length > 0 ? selectedGroups : undefined,
    };

    setReviewOpened(false);
    startGeneration(request);
    onGenerate(request);
  };

  const handleClose = () => {
    if (isGenerating) {
      cancelGeneration();
    }
    clearResults();
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Generuj fiszki AI</h2>
              <p className="text-sm text-muted-foreground">Stwórz fiszki na podstawie tekstu źródłowego</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} disabled={isGenerating}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isGenerating ? (
            /* Generation in progress */
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Generowanie fiszek...</h3>
                <p className="text-sm text-muted-foreground">
                  AI analizuje tekst i tworzy fiszki. To może zająć kilka sekund.
                </p>
              </div>
              <Button variant="outline" onClick={handleClose} className="gap-2">
                Anuluj
              </Button>
            </div>
          ) : (
            /* Generation form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Source Text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="source-text" className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Tekst źródłowy
                  </label>
                  <div className="text-xs text-muted-foreground">{characterCount}/10,000 znaków</div>
                </div>
                <textarea
                  id="source-text"
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="Wklej tutaj tekst, na podstawie którego AI wygeneruje fiszki..."
                  className="w-full h-32 px-3 py-2 border border-border rounded-md resize-none text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={isGenerating}
                />
                {!sourceTextValidation.isValid && sourceText.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    {sourceTextValidation.errors[0]}
                  </div>
                )}
                {sourceTextValidation.isValid && sourceText.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Tekst jest gotowy do przetworzenia
                  </div>
                )}
              </div>

              {/* Model Selection */}
              <div className="space-y-2">
                <label htmlFor="ai-model" className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Model AI
                </label>
                {isLoadingModels ? (
                  <div className="h-10 bg-muted animate-pulse rounded-md" />
                ) : (
                  <select
                    id="ai-model"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={isGenerating}
                  >
                    <option value="">Wybierz model...</option>
                    {availableModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {model.provider}
                        {model.is_default && " (domyślny)"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Max Cards */}
              <div className="space-y-2">
                <label htmlFor="max-cards" className="text-sm font-medium flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Maksymalna liczba fiszek
                </label>
                <Input
                  id="max-cards"
                  type="number"
                  min="1"
                  max="100"
                  value={maxCards}
                  onChange={(e) => setMaxCards(Number(e.target.value))}
                  className="w-full"
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground">Zostanie wygenerowane maksymalnie {maxCards} fiszek</p>
              </div>

              {/* Categories (Optional) */}
              <div className="space-y-2">
                <label htmlFor="categories" className="text-sm font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Kategorie (opcjonalne)
                </label>
                <MultiSelect
                  options={categoryOptions}
                  selected={selectedCategories}
                  onChange={setSelectedCategories}
                  placeholder="Wybierz kategorie..."
                  searchPlaceholder="Szukaj kategorii..."
                  emptyMessage="Brak kategorii"
                  loading={isLoadingCategories}
                  disabled={isGenerating}
                  onCreate={createCategory}
                  createLabel="Utwórz kategorię"
                />
              </div>

              {/* Groups (Optional) */}
              <div className="space-y-2">
                <label htmlFor="groups" className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Grupy (opcjonalne)
                </label>
                <MultiSelect
                  options={groupOptions}
                  selected={selectedGroups}
                  onChange={setSelectedGroups}
                  placeholder="Wybierz grupy..."
                  searchPlaceholder="Szukaj grup..."
                  emptyMessage="Brak grup"
                  loading={isLoadingGroups}
                  disabled={isGenerating}
                  onCreate={createGroup}
                  createLabel="Utwórz grupę"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  {isFormValid ? "Gotowe do generowania" : "Wypełnij wymagane pola"}
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={handleClose} disabled={isGenerating}>
                    Anuluj
                  </Button>
                  <Button type="submit" disabled={!isFormValid || isGenerating} className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Generuj fiszki
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
