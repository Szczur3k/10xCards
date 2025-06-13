import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { 
  GenerateFlashcardsCommand,
  GenerateFlashcardsResponseDTO,
  GeneratedFlashcardDTO,
  GenerationStatsDTO,
  CreateSourceTextCommand,
  SourceText
} from '../../types';
import { FlashcardService } from './flashcard.service';
import { AIModelService } from './ai-model.service';

/**
 * Service for AI-powered flashcard generation
 * Handles both initial generation and regeneration from existing source texts
 */
export class AIGenerationService {
  private flashcardService: FlashcardService;
  private aiModelService: AIModelService;

  constructor(private supabase: SupabaseClient<Database>) {
    this.flashcardService = new FlashcardService(supabase);
    this.aiModelService = new AIModelService();
  }

  /**
   * Generates or regenerates flashcards based on input
   * If source_text provided - creates new source_text and generates
   * If source_text_id provided - regenerates from existing source_text
   */
  async generateOrRegenerateFlashcards(command: GenerateFlashcardsCommand): Promise<GenerateFlashcardsResponseDTO> {
    if (command.source_text) {
      // Generate from new text
      return this.generateFlashcards(command);
    } else if (command.source_text_id) {
      // Regenerate from existing source_text
      return this.regenerateFlashcards({
        source_text_id: command.source_text_id,
        user_id: command.user_id,
        max_flashcards: command.max_flashcards,
        model: command.model,
        category_ids: command.category_ids,
        group_ids: command.group_ids
      });
    } else {
      throw {
        type: 'VALIDATION_ERROR',
        message: 'Wymagany jest source_text lub source_text_id',
        statusCode: 400
      };
    }
  }

  /**
   * Generates flashcards from new source text
   * Creates source_text record and generates flashcards
   */
  private async generateFlashcards(command: GenerateFlashcardsCommand): Promise<GenerateFlashcardsResponseDTO> {
    const startTime = Date.now();

    if (!command.source_text) {
      throw {
        type: 'VALIDATION_ERROR',
        message: 'source_text jest wymagany dla generowania',
        statusCode: 400
      };
    }

    // 1. Create source text record
    const sourceText = await this.createSourceText({
      content: command.source_text,
      user_id: command.user_id
    });

    // 2. Generate flashcards using AI
    const generationResult = await this.performAIGeneration({
      source_text_id: sourceText.id,
      user_id: command.user_id,
      max_flashcards: command.max_flashcards,
      model: command.model,
      category_ids: command.category_ids,
      group_ids: command.group_ids
    });

    return generationResult;
  }

  /**
   * Regenerates flashcards from existing source text
   * Deletes old flashcards and generates new ones
   */
  private async regenerateFlashcards(command: { source_text_id: string; user_id: string; max_flashcards: number; model?: string; category_ids?: string[]; group_ids?: string[]; }): Promise<GenerateFlashcardsResponseDTO> {
    // 1. Verify source text exists and belongs to user
    const sourceText = await this.getSourceTextById(command.source_text_id, command.user_id);

    // 2. Delete existing flashcards from this source text
    await this.deleteFlashcardsBySourceText(command.source_text_id, command.user_id);

    // 3. Generate new flashcards
    const generationResult = await this.performAIGeneration({
      source_text_id: command.source_text_id,
      user_id: command.user_id,
      max_flashcards: command.max_flashcards,
      model: command.model,
      category_ids: command.category_ids,
      group_ids: command.group_ids
    });

    return generationResult;
  }

  /**
   * Creates source text record in database
   */
  private async createSourceText(command: CreateSourceTextCommand): Promise<SourceText> {
    const { data: sourceText, error } = await this.supabase
      .from('source_texts')
      .insert({
        content: command.content,
        user_id: command.user_id
      })
      .select('*')
      .single();

    if (error) {
      throw {
        type: 'DATABASE_ERROR',
        message: 'Błąd podczas zapisywania tekstu źródłowego',
        details: { database: [error.message] },
        statusCode: 500
      };
    }

    if (!sourceText) {
      throw {
        type: 'DATABASE_ERROR',
        message: 'Nie udało się zapisać tekstu źródłowego',
        statusCode: 500
      };
    }

    return sourceText;
  }

  /**
   * Gets source text by ID with user validation
   */
  private async getSourceTextById(sourceTextId: string, userId: string): Promise<SourceText> {
    const { data: sourceText, error } = await this.supabase
      .from('source_texts')
      .select('*')
      .eq('id', sourceTextId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw {
          type: 'NOT_FOUND_ERROR',
          message: 'Tekst źródłowy nie został znaleziony',
          statusCode: 404
        };
      }
      throw {
        type: 'DATABASE_ERROR',
        message: 'Błąd podczas pobierania tekstu źródłowego',
        details: { database: [error.message] },
        statusCode: 500
      };
    }

    return sourceText;
  }

  /**
   * Deletes all flashcards associated with source text
   */
  private async deleteFlashcardsBySourceText(sourceTextId: string, userId: string): Promise<void> {
    // First delete category and group relationships
    const { data: flashcards } = await this.supabase
      .from('flashcards')
      .select('id')
      .eq('source_text_id', sourceTextId)
      .eq('user_id', userId);

    if (flashcards && flashcards.length > 0) {
      const flashcardIds = flashcards.map(f => f.id);

      // Delete relationships
      await Promise.all([
        this.supabase.from('flashcard_categories').delete().in('flashcard_id', flashcardIds),
        this.supabase.from('flashcard_groups').delete().in('flashcard_id', flashcardIds),
        this.supabase.from('flashcard_stats').delete().in('flashcard_id', flashcardIds)
      ]);

      // Delete flashcards
      const { error } = await this.supabase
        .from('flashcards')
        .delete()
        .eq('source_text_id', sourceTextId)
        .eq('user_id', userId);

      if (error) {
        throw {
          type: 'DATABASE_ERROR',
          message: 'Błąd podczas usuwania starych fiszek',
          details: { database: [error.message] },
          statusCode: 500
        };
      }
    }
  }

  /**
   * Performs the actual AI generation
   */
  private async performAIGeneration(params: {
    source_text_id: string;
    user_id: string;
    max_flashcards: number;
    model?: string;
    category_ids?: string[];
    group_ids?: string[];
  }): Promise<GenerateFlashcardsResponseDTO> {
    const startTime = Date.now();

    // 1. Get source text content
    const sourceText = await this.getSourceTextById(params.source_text_id, params.user_id);

    // 2. Select AI model
    const selectedModel = params.model || await this.selectBestModel(params.user_id);

    // 3. Generate flashcards using AI (mock implementation for now)
    const aiFlashcards = await this.callAIModel(sourceText.content, params.max_flashcards, selectedModel);

    // 4. Save flashcards to database
    const savedFlashcards: GeneratedFlashcardDTO[] = [];
    let totalTokens = 0;

    for (const aiCard of aiFlashcards) {
      const cardStartTime = Date.now();
      
      const flashcard = await this.flashcardService.createFlashcard({
        front: aiCard.front,
        back: aiCard.back,
        creation_type: 'llm',
        status: 'draft',
        user_id: params.user_id,
        source_text_id: params.source_text_id,
        category_ids: params.category_ids,
        group_ids: params.group_ids
      });

      const cardEndTime = Date.now();
      const generationTime = cardEndTime - cardStartTime;

      savedFlashcards.push({
        id: flashcard.id,
        front: flashcard.front,
        back: flashcard.back,
        creation_type: 'llm',
        status: 'draft',
        confidence_score: aiCard.confidence_score,
        generation_time_ms: generationTime
      });

      totalTokens += aiCard.token_count || 50; // Mock token count
    }

    const totalTime = Date.now() - startTime;
    const averageTime = savedFlashcards.length > 0 ? totalTime / savedFlashcards.length : 0;

    const stats: GenerationStatsDTO = {
      total_generated: savedFlashcards.length,
      total_time_ms: totalTime,
      average_time_per_card_ms: averageTime,
      total_tokens: totalTokens,
      model_used: selectedModel
    };

    return {
      source_text_id: params.source_text_id,
      model_used: selectedModel,
      flashcards: savedFlashcards,
      stats
    };
  }

  /**
   * Selects the best available AI model
   */
  private async selectBestModel(userId: string): Promise<string> {
    const modelsResponse = await this.aiModelService.getAvailableModels({ user_id: userId });
    
    // Find the default model or first available
    const defaultModel = modelsResponse.models.find(m => m.is_default && m.is_available);
    if (defaultModel) {
      return defaultModel.id;
    }

    const firstAvailable = modelsResponse.models.find(m => m.is_available);
    if (firstAvailable) {
      return firstAvailable.id;
    }

    throw {
      type: 'SERVICE_UNAVAILABLE',
      message: 'Brak dostępnych modeli AI',
      statusCode: 503
    };
  }

  /**
   * Mock AI model call - replace with real implementation
   */
  private async callAIModel(
    sourceText: string, 
    maxCards: number, 
    model: string
  ): Promise<Array<{front: string, back: string, confidence_score: number, token_count?: number}>> {
    // Mock implementation - replace with real AI API calls
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000)); // Simulate API delay

    const mockCards = [];
    const actualCount = Math.min(maxCards, Math.floor(Math.random() * 5) + 3); // 3-7 cards

    for (let i = 0; i < actualCount; i++) {
      mockCards.push({
        front: `Pytanie ${i + 1} z tekstu: ${sourceText.substring(0, 30)}...`,
        back: `Odpowiedź ${i + 1} wygenerowana przez ${model}`,
        confidence_score: 0.7 + Math.random() * 0.3, // 0.7-1.0
        token_count: Math.floor(Math.random() * 50) + 20 // 20-70 tokens
      });
    }

    return mockCards;
  }
} 