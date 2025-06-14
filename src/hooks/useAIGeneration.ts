import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { 
  GenerateFlashcardsRequestDTO, 
  GenerateFlashcardsResponseDTO,
  GeneratedFlashcardDTO,
  AIModelDTO,
  ModelsResponseDTO,
  GenerationProgressState
} from '../types';
import { useToast } from '../components/providers/ToastProvider';
import React from 'react';

/**
 * API functions for AI generation
 */
const aiGenerationApi = {
  // POST /api/flashcards/generate
  generateFlashcards: async (request: GenerateFlashcardsRequestDTO): Promise<GenerateFlashcardsResponseDTO> => {
    const response = await fetch('/api/flashcards/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate flashcards: ${response.statusText}`);
    }
    
    return response.json();
  },

  // GET /api/flashcards/models
  getAvailableModels: async (): Promise<ModelsResponseDTO> => {
    const response = await fetch('/api/flashcards/models');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }
    
    return response.json();
  },
};

/**
 * useAIGeneration - Hook for managing AI flashcard generation
 * Provides generation state management, progress tracking, and model selection
 * Implements real-time progress updates and error handling with SSE
 */
export function useAIGeneration() {
  const [generationState, setGenerationState] = useState<GenerationProgressState>({
    isGenerating: false,
    current: 0,
    total: 0,
    status: 'idle',
    generatedCards: [],
    startTime: undefined,
    estimatedTimeRemaining: undefined
  });
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);

  const { addToast } = useToast();

  // Cleanup SSE connection on unmount
  React.useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }
    };
  }, [eventSource]);

  // Query for available AI models
  const {
    data: modelsData,
    isLoading: isLoadingModels,
    error: modelsError
  } = useQuery({
    queryKey: ['ai-models'],
    queryFn: aiGenerationApi.getAvailableModels,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Setup SSE connection for real-time progress
  const setupProgressTracking = useCallback((sessionId: string) => {
    if (eventSource) {
      eventSource.close();
    }

    const newEventSource = new EventSource(`/api/flashcards/generation/${sessionId}/progress`);
    
    newEventSource.addEventListener('generation_started', (event) => {
      const data = JSON.parse(event.data);
      setGenerationState(prev => ({
        ...prev,
        current: data.current,
        total: data.total,
        status: 'generating'
      }));
    });

    newEventSource.addEventListener('generation_progress', (event) => {
      const data = JSON.parse(event.data);
      const now = Date.now();
      
      setGenerationState(prev => {
        // Calculate ETA based on progress
        let estimatedTimeRemaining: number | undefined;
        if (prev.startTime && data.current > 0 && data.total > data.current) {
          const elapsedTime = now - prev.startTime;
          const averageTimePerCard = elapsedTime / data.current;
          const remainingCards = data.total - data.current;
          estimatedTimeRemaining = Math.round(remainingCards * averageTimePerCard);
        }

        return {
          ...prev,
          current: data.current,
          total: data.total,
          status: 'generating',
          estimatedTimeRemaining
        };
      });
    });

    newEventSource.addEventListener('generation_completed', (event) => {
      const data = JSON.parse(event.data);
      setGenerationState(prev => ({
        ...prev,
        isGenerating: false,
        current: data.flashcards.length,
        total: data.flashcards.length,
        status: 'completed',
        generatedCards: data.flashcards
      }));

      newEventSource.close();
      setEventSource(null);
    });

    newEventSource.addEventListener('generation_error', (event) => {
      const data = JSON.parse(event.data);
      setGenerationState(prev => ({
        ...prev,
        isGenerating: false,
        status: 'error'
      }));

      addToast({
        type: 'error',
        title: 'Błąd podczas generowania',
        description: data.message,
        action: {
          label: 'Spróbuj ponownie',
          onClick: () => {
            setGenerationState(prev => ({ ...prev, status: 'idle' }));
          }
        }
      });

      newEventSource.close();
      setEventSource(null);
    });

    newEventSource.onerror = () => {
      // Handle connection errors
      addToast({
        type: 'error',
        title: 'Utracono połączenie',
        description: 'Utracono połączenie z serwerem podczas śledzenia postępu',
      });
      newEventSource.close();
      setEventSource(null);
    };

    setEventSource(newEventSource);
    setGenerationId(sessionId);
  }, [eventSource, addToast]);

  // Enhanced generation mutation with SSE support
  const generateMutation = useMutation({
    mutationFn: async (request: GenerateFlashcardsRequestDTO) => {
      // Start generation and get session ID
      const response = await aiGenerationApi.generateFlashcards(request);
      
      // If response includes session_id, setup SSE tracking
      if (response.source_text_id) {
        setupProgressTracking(response.source_text_id);
      }
      
      return response;
    },
    onMutate: (request) => {
      setGenerationState(prev => ({
        ...prev,
        isGenerating: true,
        current: 0,
        total: request.max_flashcards || 10,
        status: 'generating',
        generatedCards: [],
        startTime: Date.now()
      }));
    },
    onError: (error) => {
      setGenerationState(prev => ({
        ...prev,
        isGenerating: false,
        status: 'error'
      }));

      addToast({
        type: 'error',
        title: 'Błąd podczas generowania',
        description: error.message,
        action: {
          label: 'Spróbuj ponownie',
          onClick: () => {
            setGenerationState(prev => ({ ...prev, status: 'idle' }));
          }
        }
      });

      // Clean up SSE connection on error
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }
    }
  });

  // Start generation
  const startGeneration = useCallback((request: GenerateFlashcardsRequestDTO) => {
    if (generationState.isGenerating) {
      addToast({
        type: 'warning',
        title: 'Generowanie w toku',
        description: 'Poczekaj na zakończenie obecnego generowania',
      });
      return;
    }

    // Validate request
    if (!request.source_text || request.source_text.trim().length < 100) {
      addToast({
        type: 'error',
        title: 'Tekst źródłowy za krótki',
        description: 'Tekst źródłowy musi mieć co najmniej 100 znaków',
      });
      return;
    }

    if (request.source_text.length > 10000) {
      addToast({
        type: 'error',
        title: 'Tekst źródłowy za długi',
        description: 'Tekst źródłowy nie może przekraczać 10 000 znaków',
      });
      return;
    }

    if (request.max_flashcards && (request.max_flashcards < 1 || request.max_flashcards > 30)) {
      addToast({
        type: 'error',
        title: 'Nieprawidłowa liczba fiszek',
        description: 'Liczba fiszek musi być między 1 a 30',
      });
      return;
    }

    generateMutation.mutate(request);
  }, [generationState.isGenerating, addToast, generateMutation]);

  // Cancel generation (if API supports it)
  const cancelGeneration = useCallback(() => {
    if (!generationState.isGenerating) return;

    // For now, just reset state
    // In the future, could implement actual cancellation
    setGenerationState(prev => ({
      ...prev,
      isGenerating: false,
      status: 'idle'
    }));

    addToast({
      type: 'info',
      title: 'Generowanie anulowane',
    });
  }, [generationState.isGenerating, addToast]);

  // Clear results
  const clearResults = useCallback(() => {
    setGenerationState({
      isGenerating: false,
      current: 0,
      total: 0,
      status: 'idle',
      generatedCards: []
    });
  }, []);

  // Simulate progress updates (if real-time updates aren't available)
  const simulateProgress = useCallback(() => {
    if (!generationState.isGenerating) return;

    const interval = setInterval(() => {
      setGenerationState(prev => {
        if (!prev.isGenerating || prev.current >= prev.total) {
          clearInterval(interval);
          return prev;
        }

        const increment = Math.random() > 0.7 ? 1 : 0; // Simulate sporadic progress
        return {
          ...prev,
          current: Math.min(prev.current + increment, prev.total)
        };
      });
    }, 500);

    return () => clearInterval(interval);
  }, [generationState.isGenerating]);

  // Get default model
  const getDefaultModel = useCallback((): AIModelDTO | null => {
    if (!modelsData?.models) return null;
    
    return modelsData.models.find(model => model.is_default && model.is_available) || 
           modelsData.models.find(model => model.is_available) || 
           null;
  }, [modelsData]);

  // Get available models
  const getAvailableModels = useCallback((): AIModelDTO[] => {
    if (!modelsData?.models) return [];
    
    return modelsData.models.filter(model => model.is_available);
  }, [modelsData]);

  // Validate source text
  const validateSourceText = useCallback((text: string) => {
    const errors: string[] = [];
    
    if (!text || text.trim().length === 0) {
      errors.push('Tekst źródłowy jest wymagany');
    } else if (text.length < 100) {
      errors.push('Tekst źródłowy musi mieć co najmniej 100 znaków');
    } else if (text.length > 10000) {
      errors.push('Tekst źródłowy nie może przekraczać 10 000 znaków');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  return {
    // Generation state
    generationState,
    isGenerating: generationState.isGenerating,
    generationStatus: generationState.status,
    generatedCards: generationState.generatedCards,
    progress: generationState.total > 0 ? (generationState.current / generationState.total) * 100 : 0,
    
    // Models data
    availableModels: getAvailableModels(),
    defaultModel: getDefaultModel(),
    isLoadingModels,
    modelsError,
    
    // Actions
    startGeneration,
    cancelGeneration,
    clearResults,
    
    // Utilities
    validateSourceText,
    canGenerate: !generationState.isGenerating && generationState.status !== 'error',
    hasResults: generationState.generatedCards.length > 0,
    
    // Mutation states
    isGenerationError: generateMutation.isError,
    generationError: generateMutation.error,
  };
} 