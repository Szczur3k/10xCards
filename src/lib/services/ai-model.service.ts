import type {
  ModelsResponseDTO,
  AIModelDTO,
  ModelAvailabilityDTO,
  ModelStatsDTO,
  GetAvailableModelsCommand,
} from "../../types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

/**
 * Default model selection strategy configuration
 */
const DEFAULT_SELECTION_STRATEGY = {
  criteria: ["availability", "quality_score", "cost_efficiency", "response_time"],
  weights: {
    availability: 1.0, // Availability is most important
    quality: 0.5, // Quality is secondary
    cost: 0.3, // Cost optimization
    speed: 0.2, // Speed is least important for flashcard generation
  },
  fallback_to_free: true,
};

// /**
//  * Environment variable mapping for API key providers
//  */
// const API_KEY_ENV_MAP = {
//   openrouter: "OPENROUTER_API_KEY",
// } as const;

/**
 * Service for managing AI models availability and selection
 * Handles checking API key availability and filtering models accordingly
 */
export class AIModelService {
  private apiKeyCache = new Map<string, boolean>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

  constructor(private supabase?: SupabaseClient<Database>) {}

  /**
   * Gets all available models with their availability status
   * @param command - GetAvailableModelsCommand with user context
   * @returns Promise<ModelsResponseDTO> - Complete models response with strategy and stats
   */
  async getAvailableModels(
    command: GetAvailableModelsCommand,
    supabaseClient?: SupabaseClient<Database>
  ): Promise<ModelsResponseDTO> {
    try {
      const client = supabaseClient || this.supabase;
      if (!client) {
        throw {
          type: "CONFIGURATION_ERROR",
          message: "Supabase client nie jest dostępny",
          statusCode: 500,
        };
      }

      // Get models from database
      const { data: dbModels, error: dbError } = await client
        .from("ai_models")
        .select("*")
        .eq("is_active", true)
        .order("quality_score", { ascending: false });

      if (dbError) {
        console.error("Database error fetching AI models:", dbError);
        throw {
          type: "DATABASE_ERROR",
          message: "Błąd pobierania modeli z bazy danych",
          details: { database: [dbError.message] },
          statusCode: 500,
        };
      }

      if (!dbModels || dbModels.length === 0) {
        throw {
          type: "SERVICE_UNAVAILABLE_ERROR",
          message: "Brak dostępnych modeli AI",
          details: { models: ["Nie znaleziono modeli w bazie danych"] },
          statusCode: 503,
        };
      }

      // Get availability status for all models
      const modelAvailabilities = await this.checkAllModelsAvailability(dbModels);

      // Transform database models to DTOs with availability
      const models: AIModelDTO[] = dbModels.map((dbModel: unknown) => {
        const availability = modelAvailabilities.find((a) => a.model_id === dbModel.id);
        const isDefault = dbModel.recommended_for?.includes("default") || false;

        return {
          id: dbModel.id,
          name: dbModel.name,
          provider: dbModel.provider,
          cost_per_1k_tokens: dbModel.cost_per_1k_tokens,
          max_tokens: dbModel.max_tokens,
          average_response_time_ms: dbModel.average_response_time_ms,
          quality_score: dbModel.quality_score,
          recommended_for: dbModel.recommended_for || [],
          is_default: isDefault,
          is_available: availability?.is_available || false,
          requires_api_key: dbModel.requires_api_key,
          unavailable_reason: availability?.unavailable_reason,
        };
      });

      // Apply selection strategy to determine default model if none marked
      const modelsWithDefault = this.applySelectionStrategy(models);

      // Calculate statistics
      const stats = this.calculateModelStats(modelsWithDefault);

      // Validate that at least one model is available
      if (stats.available_models === 0) {
        throw {
          type: "SERVICE_UNAVAILABLE_ERROR",
          message: "Brak dostępnych modeli AI - wymagany klucz API OpenRouter",
          details: { models: ["Skonfiguruj OPENROUTER_API_KEY w zmiennych środowiskowych"] },
          statusCode: 503,
        };
      }

      return {
        models: modelsWithDefault,
        default_selection_strategy: {
          ...DEFAULT_SELECTION_STRATEGY,
          weights: {
            availability: DEFAULT_SELECTION_STRATEGY.weights.availability,
            quality: DEFAULT_SELECTION_STRATEGY.weights.quality,
            cost: DEFAULT_SELECTION_STRATEGY.weights.cost,
            speed: DEFAULT_SELECTION_STRATEGY.weights.speed,
          },
        },
        stats,
      };
    } catch (error: unknown) {
      // Re-throw known errors
      if (error.type) {
        throw error;
      }

      // Handle unexpected errors
      console.error("AIModelService.getAvailableModels error:", error);
      throw {
        type: "CONFIGURATION_ERROR",
        message: "Błąd konfiguracji modeli AI",
        details: { configuration: ["Nieprawidłowa konfiguracja modeli w systemie"] },
        statusCode: 500,
      };
    }
  }

  /**
   * Gets the best available model for flashcard generation
   */
  async getBestModel(userId: string, supabaseClient?: SupabaseClient<Database>): Promise<AIModelDTO> {
    const modelsResponse = await this.getAvailableModels({ user_id: userId }, supabaseClient);
    const availableModels = modelsResponse.models.filter((m) => m.is_available);

    if (availableModels.length === 0) {
      throw {
        type: "SERVICE_UNAVAILABLE_ERROR",
        message: "Brak dostępnych modeli AI",
        statusCode: 503,
      };
    }

    // Return default model or first available
    return availableModels.find((m) => m.is_default) || availableModels[0];
  }

  /**
   * Checks availability of all models by verifying API keys
   * @param models - Array of models to check availability for
   * @returns Promise<ModelAvailabilityDTO[]> - Availability status for all models
   */
  private async checkAllModelsAvailability(models: unknown[]): Promise<ModelAvailabilityDTO[]> {
    const availabilities: ModelAvailabilityDTO[] = [];

    for (const model of models) {
      const availability = await this.checkModelAvailability(model);
      availabilities.push(availability);
    }

    return availabilities;
  }

  /**
   * Checks if a specific model is available based on API key requirements
   * @param model - Model from database to check
   * @returns Promise<ModelAvailabilityDTO> - Availability status
   */
  private async checkModelAvailability(model: unknown): Promise<ModelAvailabilityDTO> {
    // All models require OpenRouter API key
    if (model.requires_api_key) {
      const apiKeyConfigured = this.isOpenRouterAPIKeyConfigured();

      if (!apiKeyConfigured) {
        return {
          model_id: model.id,
          is_available: false,
          unavailable_reason: "Wymagany klucz API OpenRouter",
          api_key_configured: false,
        };
      }

      return {
        model_id: model.id,
        is_available: true,
        api_key_configured: true,
      };
    }

    // Fallback for models that don't require API key (shouldn't happen with OpenRouter)
    return {
      model_id: model.id,
      is_available: false,
      unavailable_reason: "Model nie jest skonfigurowany",
      api_key_configured: false,
    };
  }

  /**
   * Checks if OpenRouter API key is configured
   */
  private isOpenRouterAPIKeyConfigured(): boolean {
    const cacheKey = "openrouter_api_key";
    const now = Date.now();

    // Check cache first
    const expiry = this.cacheExpiry.get(cacheKey);
    if (this.apiKeyCache.has(cacheKey) && expiry && expiry > now) {
      const cached = this.apiKeyCache.get(cacheKey);
      return cached || false;
    }

    // Check environment variable (both import.meta.env and process.env for compatibility)
    const apiKey = import.meta.env?.OPENROUTER_API_KEY || process.env?.OPENROUTER_API_KEY;
    const isConfigured = !!(apiKey && apiKey.trim().length > 0);

    // Cache result
    this.apiKeyCache.set(cacheKey, isConfigured);
    this.cacheExpiry.set(cacheKey, now + this.CACHE_TTL_MS);

    return isConfigured;
  }

  /**
   * Applies selection strategy to determine default model and sort models
   * @param models - Array of AIModelDTO to process
   * @returns AIModelDTO[] - Models with default selection applied
   */
  private applySelectionStrategy(models: AIModelDTO[]): AIModelDTO[] {
    // If a model is already marked as default, keep it
    const hasDefault = models.some((model) => model.is_default);
    if (hasDefault) {
      return models;
    }

    // Filter to only available models for default selection
    const availableModels = models.filter((model) => model.is_available);

    if (availableModels.length === 0) {
      return models; // Return all models even if none available
    }

    // Calculate scores for available models
    const scoredModels = availableModels.map((model) => ({
      model,
      score: this.calculateModelScore(model),
    }));

    // Sort by score (highest first)
    scoredModels.sort((a, b) => b.score - a.score);

    // Mark the highest scored model as default
    const defaultModelId = scoredModels[0]?.model.id;

    return models.map((model) => ({
      ...model,
      is_default: model.id === defaultModelId,
    }));
  }

  /**
   * Calculates a score for a model based on the selection strategy
   * @param model - AIModelDTO to score
   * @returns number - Calculated score (higher is better)
   */
  private calculateModelScore(model: AIModelDTO): number {
    const weights = DEFAULT_SELECTION_STRATEGY.weights;
    let score = 0;

    // Availability (binary: 1 for available, 0 for not)
    score += weights.availability * (model.is_available ? 1 : 0);

    // Quality score (0-1 scale)
    score += weights.quality * model.quality_score;

    // Cost efficiency (invert cost - lower cost = higher score)
    // Normalize by dividing by max reasonable cost (0.02 per 1k tokens)
    const costEfficiency = model.cost_per_1k_tokens === 0 ? 1 : Math.max(0, 1 - model.cost_per_1k_tokens / 0.02);
    score += weights.cost * costEfficiency;

    // Speed (invert response time - lower time = higher score)
    // Normalize by dividing by max reasonable time (5000ms)
    const speedScore = Math.max(0, 1 - model.average_response_time_ms / 5000);
    score += weights.speed * speedScore;

    return score;
  }

  /**
   * Calculates statistics for the models collection
   * @param models - Array of AIModelDTO to analyze
   * @returns ModelStatsDTO - Statistical summary
   */
  private calculateModelStats(models: AIModelDTO[]): ModelStatsDTO {
    const totalModels = models.length;
    const availableModels = models.filter((model) => model.is_available).length;
    const freeModels = models.filter((model) => model.cost_per_1k_tokens === 0 && model.is_available).length;
    const paidModels = models.filter((model) => model.cost_per_1k_tokens > 0 && model.is_available).length;

    return {
      total_models: totalModels,
      available_models: availableModels,
      free_models: freeModels,
      paid_models: paidModels,
    };
  }

  /**
   * Clears the API key cache
   */
  public clearCache(): void {
    this.apiKeyCache.clear();
    this.cacheExpiry.clear();
  }
}
