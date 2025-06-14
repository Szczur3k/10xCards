import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { MultiSelect } from '../ui/multi-select';
import { 
  X, 
  Sparkles, 
  FileText, 
  Hash,
  Tag,
  Users,
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAIGeneration } from '../../hooks/useAIGeneration';
import { useCategories } from '../../hooks/useCategories';
import { useGroups } from '../../hooks/useGroups';
import type { GenerateFlashcardsRequestDTO } from '../../types';

interface AIGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (request: GenerateFlashcardsRequestDTO) => void;
  onOpenReview?: () => void;
}

/**
 * AIGenerationModal - Modal for AI flashcard generation
 * Single-step form with source text, model selection, and options
 * Implements form validation and character counting
 */
export function AIGenerationModal({ 
  isOpen, 
  onClose, 
  onGenerate,
  onOpenReview 
}: AIGenerationModalProps) {
  const [sourceText, setSourceText] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [maxCards, setMaxCards] = useState(10);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [elapsedTime, setElapsedTime] = useState('0s');

  const {
    availableModels,
    defaultModel,
    isLoadingModels,
    validateSourceText,
    isGenerating,
    generationStatus,
    generationState,
    progress,
    hasResults,
    generatedCards,
    startGeneration,
    cancelGeneration,
    clearResults
  } = useAIGeneration();

  const {
    categoryOptions,
    isLoading: isLoadingCategories,
    createCategory
  } = useCategories();

  const {
    groupOptions,
    isLoading: isLoadingGroups,
    createGroup
  } = useGroups();

  // Set default model when models load
  useEffect(() => {
    if (defaultModel && !selectedModel) {
      setSelectedModel(defaultModel.id);
    }
  }, [defaultModel, selectedModel]);

  // Enhanced auto-transition to ReviewCarousel with countdown
  useEffect(() => {
    console.log('Auto-transition check:', { 
      generationStatus, 
      hasResults, 
      onOpenReview: !!onOpenReview,
      generatedCardsLength: generatedCards.length 
    });
    
    if (generationStatus === 'completed' && hasResults && onOpenReview) {
      console.log('Starting auto-transition to ReviewCarousel');
      // Show completion state briefly, then auto-transition
      const timer = setTimeout(() => {
        console.log('Executing auto-transition');
        onClose();
        onOpenReview();
      }, 2000); // 2 second delay to show completion

      return () => clearTimeout(timer);
    }
  }, [generationStatus, hasResults, onClose, onOpenReview, generatedCards.length]);

  // Real-time elapsed time updates
  useEffect(() => {
    if (isGenerating && generationState.startTime) {
      const interval = setInterval(() => {
        setElapsedTime(formatTime(Date.now() - generationState.startTime!));
      }, 1000);

      return () => clearInterval(interval);
    } else if (!isGenerating) {
      setElapsedTime('0s');
    }
  }, [isGenerating, generationState.startTime]);

  if (!isOpen) return null;

  const sourceTextValidation = validateSourceText(sourceText);
  const characterCount = sourceText.length;
  const isFormValid = sourceTextValidation.isValid && 
                     selectedModel && 
                     maxCards >= 1 && 
                     maxCards <= 30;

  // Debug render conditions
  console.log('Render conditions:', {
    isGenerating,
    generationStatus,
    shouldShowForm: !isGenerating && generationStatus !== 'completed',
    shouldShowProgress: isGenerating,
    hasResults
  });

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

    // Use the hook's startGeneration directly to enable SSE
    startGeneration(request);
    
    // Also call the parent's onGenerate for compatibility
    onGenerate(request);
  };

  const handleClose = () => {
    if (isGenerating) {
      cancelGeneration();
    }
    // Reset generation state when closing
    clearResults();
    onClose();
  };

  // Helper functions for progress display
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getElapsedTime = (): string => {
    return elapsedTime;
  };

  const getETA = (): string => {
    if (!generationState.estimatedTimeRemaining) return 'obliczanie...';
    return formatTime(generationState.estimatedTimeRemaining);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg shadow-xl max-w-3xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Generuj fiszki AI</h2>
              <p className="text-sm text-muted-foreground">
                Stwórz fiszki na podstawie tekstu źródłowego
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={isGenerating}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form - Hide during generation */}
        {!isGenerating && generationStatus !== 'completed' && (
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="p-6 space-y-6 overflow-y-auto">
            {/* Source Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Tekst źródłowy
                </label>
                <div className="text-xs text-muted-foreground">
                  {characterCount}/10,000 znaków
                </div>
              </div>
              <textarea
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
              <label className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Model AI
              </label>
              {isLoadingModels ? (
                <div className="h-10 bg-muted animate-pulse rounded-md" />
              ) : (
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={isGenerating}
                >
                  <option value="">Wybierz model...</option>
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} - {model.provider}
                      {model.is_default && ' (domyślny)'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Max Cards */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Maksymalna liczba fiszek
              </label>
              <Input
                type="number"
                min="1"
                max="30"
                value={maxCards}
                onChange={(e) => setMaxCards(Number(e.target.value))}
                className="w-full"
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground">
                Zostanie wygenerowane maksymalnie {maxCards} fiszek
              </p>
            </div>

            {/* Categories (Optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Kategorie (opcjonalne)
              </label>
              <div className="text-sm text-muted-foreground mb-2">
                Wybrane kategorie zostaną automatycznie przypisane do nowych fiszek
              </div>
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
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Grupy (opcjonalne)
              </label>
              <div className="text-sm text-muted-foreground mb-2">
                Wybrane grupy zostaną automatycznie przypisane do nowych fiszek
              </div>
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
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-6 border-t border-border">
            <div className="text-sm text-muted-foreground">
              {isFormValid ? 'Gotowe do generowania' : 'Wypełnij wymagane pola'}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isGenerating}
              >
                {isGenerating ? 'Anuluj' : 'Zamknij'}
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Generuję...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generuj fiszki
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
        )}

        {/* Progress Only View - Show during generation */}
        {isGenerating && (
          <div className="flex flex-col min-h-[400px]">
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="max-w-md w-full space-y-6">
                {/* Progress Header */}
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                  <h3 className="text-lg font-semibold">Generowanie fiszek w toku</h3>
                  <p className="text-sm text-muted-foreground">
                    AI analizuje tekst i tworzy fiszki. To może zająć kilka sekund...
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Postęp generowania</span>
                    <span className="text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className="h-3 bg-primary rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Detailed Progress Info */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Wygenerowane fiszki:</span>
                    <span className="font-medium">{generationState.current} / {generationState.total}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Czas trwania:</span>
                    <span className="font-medium">{getElapsedTime()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Szacowany czas:</span>
                    <span className="font-medium">{getETA()}</span>
                  </div>
                </div>

                {/* Cancel Button */}
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="gap-2"
                  >
                    Anuluj generowanie
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completion State - Show when completed but before auto-transition */}
        {!isGenerating && generationStatus === 'completed' && (
          <div className="flex flex-col min-h-[400px]">
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="max-w-md w-full space-y-6 text-center">
                {/* Completion Header */}
                <div className="space-y-4">
                  <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-green-600 mb-2">
                      ✨ Generowanie zakończone!
                    </h3>
                    <p className="text-muted-foreground">
                      Wygenerowano {generatedCards.length} fiszek. 
                      Automatycznie przejdziesz do przeglądu za chwilę...
                    </p>
                  </div>
                </div>

                {/* Progress Bar - Completed */}
                <div className="space-y-2">
                  <div className="w-full bg-muted rounded-full h-3">
                    <div className="h-3 bg-green-600 rounded-full w-full transition-all duration-300" />
                  </div>
                  <p className="text-sm text-green-600 font-medium">100% ukończone</p>
                </div>

                {/* Manual transition button */}
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      onClose();
                      onOpenReview && onOpenReview();
                    }}
                    className="w-full gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Przejrzyj fiszki teraz
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="w-full"
                  >
                    Zamknij
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 