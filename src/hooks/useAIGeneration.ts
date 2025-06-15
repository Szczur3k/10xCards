import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '../components/providers/ToastProvider';
import type { 
  GenerateFlashcardsRequestDTO, 
  GeneratedFlashcardDTO,
  AIModelDTO,
  GenerateFlashcardsResponseDTO
} from '../types';
import React from 'react';

// Simple API functions
const api = {
  generateFlashcards: async (request: GenerateFlashcardsRequestDTO, options?: { signal?: AbortSignal }): Promise<GenerateFlashcardsResponseDTO> => {
    const response = await fetch('/api/flashcards/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: options?.signal,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate flashcards: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  getAvailableModels: async (): Promise<AIModelDTO[]> => {
    const response = await fetch('/api/flashcards/models');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.models || [];
  }
};

interface GenerationState {
  isGenerating: boolean;
  status: 'idle' | 'generating' | 'completed' | 'error';
  generatedCards: GeneratedFlashcardDTO[];
  error?: string;
}

/**
 * useAIGeneration - Simplified hook for AI flashcard generation
 * Handles form validation, model management, and generation flow
 * Removed complex SSE logic for better reliability
 */
export function useAIGeneration() {
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    status: 'idle',
    generatedCards: [],
    error: undefined
  });

  const [availableModels, setAvailableModels] = useState<AIModelDTO[]>([]);
  const [defaultModel, setDefaultModel] = useState<AIModelDTO | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  const { addToast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load available models
  const loadModels = useCallback(async () => {
    try {
      setIsLoadingModels(true);
      const models = await api.getAvailableModels();
      setAvailableModels(models);
      
      const defaultModel = models.find((m: AIModelDTO) => m.is_default) || models[0];
      setDefaultModel(defaultModel);
    } catch (error) {
      console.error('Error loading models:', error);
      addToast({
        type: 'error',
        title: 'Błąd ładowania modeli',
        description: 'Nie udało się załadować dostępnych modeli AI',
      });
    } finally {
      setIsLoadingModels(false);
    }
  }, [addToast]);

  // Initialize models on first use
  React.useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Validate source text
  const validateSourceText = useCallback((text: string) => {
    const errors: string[] = [];
    
    if (!text || text.trim().length === 0) {
      errors.push('Tekst źródłowy jest wymagany');
    } else if (text.length < 1000) {
      errors.push('Tekst źródłowy musi mieć co najmniej 1,000 znaków');
    } else if (text.length > 10000) {
      errors.push('Tekst źródłowy nie może przekraczać 10,000 znaków');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Generation mutation
  const generateMutation = useMutation({
    mutationFn: async (request: GenerateFlashcardsRequestDTO) => {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();
      
      return await api.generateFlashcards(request, {
        signal: abortControllerRef.current.signal
      });
    },
    onMutate: () => {
      setGenerationState({
        isGenerating: true,
        status: 'generating',
        generatedCards: [],
        error: undefined
      });
    },
    onSuccess: (response) => {
      console.log('Generation completed successfully:', response);
      setGenerationState({
        isGenerating: false,
        status: 'completed',
        generatedCards: response.flashcards,
        error: undefined
      });
      
      addToast({
        type: 'success',
        title: 'Fiszki wygenerowane!',
        description: `Pomyślnie wygenerowano ${response.flashcards.length} fiszek`,
      });
    },
    onError: (error) => {
      console.error('Generation failed:', error);
      setGenerationState({
        isGenerating: false,
        status: 'error',
        generatedCards: [],
        error: error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd'
      });

      addToast({
        type: 'error',
        title: 'Błąd generowania',
        description: error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd',
      });
    }
  });

  // Start generation
  const startGeneration = useCallback((request: GenerateFlashcardsRequestDTO) => {
    // Validate request
    if (!request.source_text || request.source_text.trim().length < 1000) {
      addToast({
        type: 'error',
        title: 'Tekst źródłowy za krótki',
        description: 'Tekst źródłowy musi mieć co najmniej 1,000 znaków',
      });
      return;
    }

    if (request.source_text.length > 10000) {
      addToast({
        type: 'error',
        title: 'Tekst źródłowy za długi',
        description: 'Tekst źródłowy nie może przekraczać 10,000 znaków',
      });
      return;
    }

    if (request.max_flashcards && (request.max_flashcards < 1 || request.max_flashcards > 100)) {
      addToast({
        type: 'error',
        title: 'Nieprawidłowa liczba fiszek',
        description: 'Liczba fiszek musi być między 1 a 100',
      });
      return;
    }

    generateMutation.mutate(request);
  }, [generateMutation, addToast]);

  // Cancel generation
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setGenerationState({
      isGenerating: false,
      status: 'idle',
      generatedCards: [],
      error: undefined
    });
  }, []);

  // Clear results
  const clearResults = useCallback(() => {
    setGenerationState({
      isGenerating: false,
      status: 'idle',
      generatedCards: [],
      error: undefined
    });
  }, []);

  return {
    // Models
    availableModels,
    defaultModel,
    isLoadingModels,
    
    // Validation
    validateSourceText,
    
    // Generation state
    isGenerating: generationState.isGenerating,
    generationStatus: generationState.status,
    generatedCards: generationState.generatedCards,
    hasResults: generationState.generatedCards.length > 0,
    error: generationState.error,
    
    // Actions
    startGeneration,
    cancelGeneration,
    clearResults,
    
    // Mutation state
    isLoading: generateMutation.isPending
  };
} 