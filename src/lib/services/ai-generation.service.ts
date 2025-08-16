import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  GenerateFlashcardsCommand,
  GenerateFlashcardsResponseDTO,
  GeneratedFlashcardDTO,
  GenerationStatsDTO,
  CreateSourceTextCommand,
  SourceText,
} from "../../types";
import { FlashcardService } from "./flashcard.service";
import { AIModelService } from "./ai-model.service";
import { OpenRouterService } from "./openrouter/client";
import { validateAIFlashcardsResponse } from "../validation/flashcard.schemas";

/**
 * Service for AI-powered flashcard generation
 * Handles both initial generation and regeneration from existing source texts
 */
export class AIGenerationService {
  private flashcardService: FlashcardService;
  private aiModelService: AIModelService;
  private openRouterService: OpenRouterService;

  constructor(private supabase: SupabaseClient<Database>) {
    this.flashcardService = new FlashcardService(supabase);
    this.aiModelService = new AIModelService();

    // Initialize OpenRouter service
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY nie jest skonfigurowany");
    }

    this.openRouterService = new OpenRouterService({
      apiKey,
      enableLogging: import.meta.env.DEV,
      timeout: 60000, // 1 minute timeout for flashcard generation
      retryAttempts: 2,
    });
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
        group_ids: command.group_ids,
      });
    } else {
      throw {
        type: "VALIDATION_ERROR",
        message: "Wymagany jest source_text lub source_text_id",
        statusCode: 400,
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
        type: "VALIDATION_ERROR",
        message: "source_text jest wymagany dla generowania",
        statusCode: 400,
      };
    }

    // 1. Create source text record
    const sourceText = await this.createSourceText({
      content: command.source_text,
      user_id: command.user_id,
    });

    // 2. Generate flashcards using AI
    const generationResult = await this.performAIGeneration({
      source_text_id: sourceText.id,
      user_id: command.user_id,
      max_flashcards: command.max_flashcards,
      model: command.model,
      category_ids: command.category_ids,
      group_ids: command.group_ids,
    });

    return generationResult;
  }

  /**
   * Regenerates flashcards from existing source text
   * Deletes old flashcards and generates new ones
   */
  private async regenerateFlashcards(command: {
    source_text_id: string;
    user_id: string;
    max_flashcards: number;
    model?: string;
    category_ids?: string[];
    group_ids?: string[];
  }): Promise<GenerateFlashcardsResponseDTO> {
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
      group_ids: command.group_ids,
    });

    return generationResult;
  }

  /**
   * Creates source text record in database
   */
  private async createSourceText(command: CreateSourceTextCommand): Promise<SourceText> {
    const { data: sourceText, error } = await this.supabase
      .from("source_texts")
      .insert({
        content: command.content,
        user_id: command.user_id,
      })
      .select("*")
      .single();

    if (error) {
      throw {
        type: "DATABASE_ERROR",
        message: "Błąd podczas zapisywania tekstu źródłowego",
        details: { database: [error.message] },
        statusCode: 500,
      };
    }

    if (!sourceText) {
      throw {
        type: "DATABASE_ERROR",
        message: "Nie udało się zapisać tekstu źródłowego",
        statusCode: 500,
      };
    }

    return sourceText;
  }

  /**
   * Gets source text by ID with user validation
   */
  private async getSourceTextById(sourceTextId: string, userId: string): Promise<SourceText> {
    const { data: sourceText, error } = await this.supabase
      .from("source_texts")
      .select("*")
      .eq("id", sourceTextId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw {
          type: "NOT_FOUND_ERROR",
          message: "Tekst źródłowy nie został znaleziony",
          statusCode: 404,
        };
      }
      throw {
        type: "DATABASE_ERROR",
        message: "Błąd podczas pobierania tekstu źródłowego",
        details: { database: [error.message] },
        statusCode: 500,
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
      .from("flashcards")
      .select("id")
      .eq("source_text_id", sourceTextId)
      .eq("user_id", userId);

    if (flashcards && flashcards.length > 0) {
      const flashcardIds = flashcards.map((f) => f.id);

      // Delete relationships
      await Promise.all([
        this.supabase.from("flashcard_categories").delete().in("flashcard_id", flashcardIds),
        this.supabase.from("flashcard_groups").delete().in("flashcard_id", flashcardIds),
        this.supabase.from("flashcard_stats").delete().in("flashcard_id", flashcardIds),
      ]);

      // Delete flashcards
      const { error } = await this.supabase
        .from("flashcards")
        .delete()
        .eq("source_text_id", sourceTextId)
        .eq("user_id", userId);

      if (error) {
        throw {
          type: "DATABASE_ERROR",
          message: "Błąd podczas usuwania starych fiszek",
          details: { database: [error.message] },
          statusCode: 500,
        };
      }
    }
  }

  /**
   * Performs the actual AI generation with real progress tracking
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
    const selectedModel = params.model || (await this.selectBestModel(params.user_id));

    // 3. Create generation session for progress tracking
    await this.createGenerationSession({
      source_text_id: params.source_text_id,
      user_id: params.user_id,
      total_flashcards: params.max_flashcards,
      model_used: selectedModel,
      request_data: params,
    });

    // 4. Generate flashcards using AI with progress tracking
    const aiFlashcards = await this.callAIModelWithProgress(
      sourceText.content,
      params.max_flashcards,
      selectedModel,
      params.source_text_id
    );

    // 5. Prepare flashcards for review (DON'T save to database yet)
    const generatedFlashcards: GeneratedFlashcardDTO[] = [];
    let totalTokens = 0;

    for (let i = 0; i < aiFlashcards.length; i++) {
      const aiCard = aiFlashcards[i];

      // Create temporary ID for frontend tracking
      const tempId = `temp_${Date.now()}_${i}`;

      generatedFlashcards.push({
        id: tempId, // Temporary ID - will be replaced when saved to DB
        front: aiCard.front,
        back: aiCard.back,
        creation_type: "llm",
        status: "pending_review", // New status for review phase
        confidence_score: aiCard.confidence_score,
        generation_time_ms: 0, // Will be set when actually saved
      });

      totalTokens += aiCard.token_count || 50;

      // Update progress after each flashcard is prepared
      await this.updateGenerationProgress(params.source_text_id, i + 1);
    }

    const totalTime = Date.now() - startTime;
    const averageTime = generatedFlashcards.length > 0 ? totalTime / generatedFlashcards.length : 0;

    const stats: GenerationStatsDTO = {
      total_generated: generatedFlashcards.length,
      total_time_ms: totalTime,
      average_time_per_card_ms: averageTime,
      total_tokens: totalTokens,
      model_used: selectedModel,
    };

    const result = {
      source_text_id: params.source_text_id,
      model_used: selectedModel,
      flashcards: generatedFlashcards,
      stats,
    };

    // 6. Complete generation session
    await this.completeGenerationSession(params.source_text_id, result);

    return result;
  }

  /**
   * Generate flashcards using OpenRouter AI with specific prompt
   */
  private async callAIModelWithProgress(
    sourceText: string,
    maxCards: number,
    model: string,
    sessionId: string
  ): Promise<Array<{ front: string; back: string; confidence_score: number; token_count?: number }>> {
    const startTime = Date.now();

    // Create system prompt for flashcard generation
    const systemPrompt = `Tworzysz fiszki edukacyjne w formacie JSON. Odpowiadaj TYLKO JSON-em, bez żadnych dodatkowych komentarzy.

Format odpowiedzi:
{
  "card1": { "front": "pytanie", "back": "odpowiedź" },
  "card2": { "front": "pytanie", "back": "odpowiedź" }
}

Zasady:
- Front: maksymalnie 200 znaków
- Back: maksymalnie 500 znaków
- Używaj prostego języka
- Każda fiszka unikalna`;

    const userPrompt = `Stwórz maksymalnie ${maxCards} fiszek na podstawie tego tekstu:

${sourceText}`;

    try {
      // Call OpenRouter API
      const response = await this.openRouterService.chat(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        {
          temperature: 0.7,
          max_tokens: 6000,
          top_p: 0.9,
        },
        model
      );

      const aiResponse = response.choices[0]?.message?.content || "";
      const totalTokens = response.usage?.total_tokens || 0;
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Parse and validate JSON response using schema
      const flashcardsData = this.parseFlashcardsFromAI(aiResponse);

      // Convert to expected format with confidence scores
      const cards = Object.entries(flashcardsData).map(([key, card]) => ({
        front: card.front, // Already validated by schema
        back: card.back, // Already validated by schema
        confidence_score: 0.85 + Math.random() * 0.15, // 0.85-1.0 range
        token_count: Math.floor(totalTokens / Object.keys(flashcardsData).length),
      }));

      return cards;
    } catch (error) {
      console.error("AI generation error:", error);

      // If it's already a structured error (from OpenRouter), re-throw it
      if (error && typeof error === "object" && "code" in error && "message" in error) {
        // Convert OpenRouter error to our API format
        const statusCode = "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500;
        throw {
          type: error.code || "AI_GENERATION_ERROR",
          message: error.message,
          details: { ai: [error.message] },
          statusCode,
        };
      }

      // Otherwise, wrap in generic AI error
      throw {
        type: "AI_GENERATION_ERROR",
        message: "Błąd podczas generowania fiszek przez AI",
        details: { ai: [error instanceof Error ? error.message : "Nieznany błąd AI"] },
        statusCode: 500,
      };
    }
  }

  /**
   * Parse flashcards from AI response JSON using validation schema
   */
  private parseFlashcardsFromAI(aiResponse: string): Record<string, { front: string; back: string }> {
    try {
      console.log("AI Response to parse:", aiResponse.substring(0, 1000));

      // Try multiple JSON extraction strategies
      let jsonString = "";

      // Strategy 1: Find JSON object with curly braces
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      } else {
        // Strategy 2: Look for JSON-like patterns with quotes
        const quotedMatch = aiResponse.match(/"card\d+"[\s\S]*?"back"[\s\S]*?"/);
        if (quotedMatch) {
          // Try to reconstruct JSON from fragments
          const cardMatches = aiResponse.match(/"card\d+"\s*:\s*\{[^}]*\}/g);
          if (cardMatches) {
            jsonString = "{" + cardMatches.join(",") + "}";
          }
        }
      }

      if (!jsonString) {
        throw new Error("Nie znaleziono poprawnego formatu JSON w odpowiedzi AI");
      }

      // Clean up common JSON issues
      jsonString = jsonString
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
        .replace(/,\s*}/g, "}") // Remove trailing commas
        .replace(/,\s*]/g, "]"); // Remove trailing commas in arrays

      console.log("Extracted JSON string:", jsonString);

      const parsed = JSON.parse(jsonString);

      // Use schema validation instead of manual validation
      const validation = validateAIFlashcardsResponse(parsed);
      if (!validation.success) {
        throw validation.error;
      }

      return validation.data!;
    } catch (error) {
      console.error("Error parsing AI response:", error, "Full Response:", aiResponse);

      // If it's already a validation error, re-throw
      if (error && typeof error === "object" && "type" in error) {
        throw error;
      }

      // Otherwise wrap in parsing error
      throw {
        type: "AI_PARSING_ERROR",
        message: "Błąd parsowania odpowiedzi AI",
        details: { parsing: [error instanceof Error ? error.message : "Błąd parsowania JSON"] },
        statusCode: 500,
      };
    }
  }

  /**
   * Regenerates a single flashcard from source text (without database operations)
   */
  async regenerateSingleFlashcard(params: {
    source_text: string;
    rejected_flashcard: { front: string; back: string };
    user_id: string;
    model?: string;
  }): Promise<Omit<GeneratedFlashcardDTO, "id">> {
    const startTime = Date.now();

    // Select AI model
    const selectedModel = params.model || (await this.selectBestModel(params.user_id));

    // Create enhanced prompt that mentions the rejected flashcard
    const systemPrompt = `Tworzysz JEDNĄ nową fiszkę w formacie JSON. Odpowiadaj TYLKO JSON-em.

Format odpowiedzi:
{
  "card1": { "front": "pytanie", "back": "odpowiedź" }
}

Zasady:
- Front: maksymalnie 200 znaków
- Back: maksymalnie 500 znaków
- Fiszka różna od odrzuconej`;

    const userPrompt = `Stwórz JEDNĄ nową fiszkę na podstawie tego tekstu:

${params.source_text}

ODRZUCONA FISZKA (stwórz coś innego):
Front: ${params.rejected_flashcard.front}
Back: ${params.rejected_flashcard.back}`;

    try {
      // Call OpenRouter API
      const response = await this.openRouterService.chat(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        {
          temperature: 0.8, // Higher temperature for more variety
          max_tokens: 6000,
          top_p: 0.9,
        },
        selectedModel
      );

      const aiResponse = response.choices[0]?.message?.content || "";
      const endTime = Date.now();
      const generationTime = endTime - startTime;

      // Parse and validate JSON response
      const flashcardsData = this.parseFlashcardsFromAI(aiResponse);
      const cardEntries = Object.entries(flashcardsData);

      if (cardEntries.length === 0) {
        throw new Error("AI nie wygenerowało żadnej fiszki");
      }

      const [, card] = cardEntries[0]; // Get first (and should be only) card

      // Return card without ID - it will be set by the caller to preserve status
      const regeneratedCard: Omit<GeneratedFlashcardDTO, "id"> = {
        front: card.front,
        back: card.back,
        creation_type: "llm",
        status: "pending_review",
        confidence_score: 0.85 + Math.random() * 0.15, // 0.85-1.0 range
        generation_time_ms: generationTime,
      };

      return regeneratedCard;
    } catch (error) {
      console.error("Single flashcard regeneration error:", error);

      // If it's already a structured error (from OpenRouter), re-throw it
      if (error && typeof error === "object" && "code" in error && "message" in error) {
        // Convert OpenRouter error to our API format
        const statusCode = "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500;
        throw {
          type: error.code || "AI_GENERATION_ERROR",
          message: error.message,
          details: { ai: [error.message] },
          statusCode,
        };
      }

      // Otherwise, wrap in generic AI error
      throw {
        type: "AI_GENERATION_ERROR",
        message: "Błąd podczas regeneracji fiszki przez AI",
        details: { ai: [error instanceof Error ? error.message : "Nieznany błąd AI"] },
        statusCode: 500,
      };
    }
  }

  /**
   * Selects the best available AI model
   */
  private async selectBestModel(userId: string): Promise<string> {
    const modelsResponse = await this.aiModelService.getAvailableModels({ user_id: userId }, this.supabase);

    // Find the default model or first available
    const defaultModel = modelsResponse.models.find((m) => m.is_default && m.is_available);
    if (defaultModel) {
      return defaultModel.id;
    }

    const firstAvailable = modelsResponse.models.find((m) => m.is_available);
    if (firstAvailable) {
      return firstAvailable.id;
    }

    throw {
      type: "SERVICE_UNAVAILABLE",
      message: "Brak dostępnych modeli AI",
      statusCode: 503,
    };
  }

  /**
   * Creates a generation session for progress tracking
   */
  private async createGenerationSession(params: {
    source_text_id: string;
    user_id: string;
    total_flashcards: number;
    model_used: string;
    request_data: any;
  }): Promise<void> {
    const { error } = await this.supabase.from("generation_sessions").insert({
      source_text_id: params.source_text_id,
      user_id: params.user_id,
      status: "generating",
      total_flashcards: params.total_flashcards,
      current_flashcards: 0,
      model_used: params.model_used,
      request_data: params.request_data,
    });

    if (error) {
      console.error("Failed to create generation session:", error);
      // Don't throw error - progress tracking is not critical
    }
  }

  /**
   * Updates generation progress
   */
  private async updateGenerationProgress(sourceTextId: string, currentCards: number): Promise<void> {
    const { error } = await this.supabase
      .from("generation_sessions")
      .update({
        current_flashcards: currentCards,
        updated_at: new Date().toISOString(),
      })
      .eq("source_text_id", sourceTextId);

    if (error) {
      console.error("Failed to update generation progress:", error);
      // Don't throw error - progress tracking is not critical
    }
  }

  /**
   * Completes generation session
   */
  private async completeGenerationSession(sourceTextId: string, result: any): Promise<void> {
    const { error } = await this.supabase
      .from("generation_sessions")
      .update({
        status: "completed",
        result_data: result,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("source_text_id", sourceTextId);

    if (error) {
      console.error("Failed to complete generation session:", error);
      // Don't throw error - progress tracking is not critical
    }
  }
}
