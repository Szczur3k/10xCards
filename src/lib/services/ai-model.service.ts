import type { 
  ModelsResponseDTO, 
  AIModelDTO, 
  ModelAvailabilityDTO,
  ModelStatsDTO,
  GetAvailableModelsCommand 
} from '../../types';
import { supabaseClient } from '../../db/supabase.client';

/**
 * Default model selection strategy configuration
 */
const DEFAULT_SELECTION_STRATEGY = {
  criteria: ["availability", "quality_score", "cost_efficiency", "response_time"],
  weights: {
    availability: 1.0,  // Availability is most important
    quality: 0.5,       // Quality is secondary
    cost: 0.3,          // Cost optimization
    speed: 0.2          // Speed is least important for flashcard generation
  },
  fallback_to_free: true
};

/**
 * Environment variable mapping for API key providers
 */
const API_KEY_ENV_MAP = {
  openrouter: "OPENROUTER_API_KEY"
} as const;

/**
 * Service for managing AI models availability and selection
 * Handles checking API key availability and filtering models accordingly
 */
export class AIModelService {
  private apiKeyCache = new Map<string, boolean>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

  /**
   * Gets all available models with their availability status
   * @param command - GetAvailableModelsCommand with user context
   * @returns Promise<ModelsResponseDTO> - Complete models response with strategy and stats
   */
  async getAvailableModels(command: GetAvailableModelsCommand): Promise<ModelsResponseDTO> {
    try {
      // Get models from database
      const { data: dbModels, error: dbError } = await supabaseClient
        .from('ai_models')
        .select('*');

      if (dbError) {
        console.error('Database error fetching AI models:', dbError);
        throw {
          type: 'DATABASE_ERROR',
          message: 'Błąd pobierania modeli z bazy danych',
          details: { database: [dbError.message] },
          statusCode: 500
        };
      }

      if (!dbModels || dbModels.length === 0) {
        throw {
          type: 'SERVICE_UNAVAILABLE_ERROR',
          message: 'Brak dostępnych modeli AI',
          details: { models: ['Nie znaleziono modeli w bazie danych'] },
          statusCode: 503
        };
      }

      // Get availability status for all models
      const modelAvailabilities = await this.checkAllModelsAvailability(dbModels);
      
      // Transform database models to DTOs with availability
      const models: AIModelDTO[] = dbModels.map((dbModel: any) => {
        const availability = modelAvailabilities.find(a => a.model_id === dbModel.id);
        
        return {
          id: dbModel.id,
          name: dbModel.name,
          provider: dbModel.provider,
          cost_per_1k_tokens: dbModel.cost_per_1k_tokens,
          max_tokens: dbModel.max_tokens,
          average_response_time_ms: dbModel.average_response_time_ms,
          quality_score: dbModel.quality_score,
          recommended_for: dbModel.recommended_for,
          is_default: false, // Will be calculated based on strategy
          is_available: availability?.is_available || false,
          requires_api_key: dbModel.requires_api_key,
          unavailable_reason: availability?.unavailable_reason
        };
      });

      // Apply selection strategy to determine default model
      const modelsWithDefault = this.applySelectionStrategy(models);
      
      // Calculate statistics
      const stats = this.calculateModelStats(modelsWithDefault);
      
      // Validate that at least one model is available
      if (stats.available_models === 0) {
        throw {
          type: 'SERVICE_UNAVAILABLE_ERROR',
          message: 'Brak dostępnych modeli AI',
          details: { models: ['Wszystkie modele wymagają konfiguracji kluczy API'] },
          statusCode: 503
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
            speed: DEFAULT_SELECTION_STRATEGY.weights.speed
          }
        },
        stats
      };

    } catch (error: any) {
      // Re-throw known errors
      if (error.type) {
        throw error;
      }

      // Handle unexpected errors
      console.error('AIModelService.getAvailableModels error:', error);
      throw {
        type: 'CONFIGURATION_ERROR',
        message: 'Błąd konfiguracji modeli AI',
        details: { configuration: ['Nieprawidłowa konfiguracja modeli w systemie'] },
        statusCode: 500
      };
    }
  }

  /**
   * Checks availability of all models by verifying API keys
   * @param models - Array of models to check availability for
   * @returns Promise<ModelAvailabilityDTO[]> - Availability status for all models
   */
  private async checkAllModelsAvailability(models: any[]): Promise<ModelAvailabilityDTO[]> {
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
  private async checkModelAvailability(model: any): Promise<ModelAvailabilityDTO> {
    // Free models are always available
    if (!model.requires_api_key) {
      return {
        model_id: model.id,
        is_available: true,
        api_key_configured: false
      };
    }

    // Get env key based on provider
    const envKey = API_KEY_ENV_MAP[model.provider as keyof typeof API_KEY_ENV_MAP];
    if (!envKey) {
      return {
        model_id: model.id,
        is_available: false,
        unavailable_reason: "Unknown provider",
        api_key_configured: false
      };
    }

    // Check if API key is configured for paid models
    const apiKeyConfigured = this.isAPIKeyConfigured(envKey);
    
    if (!apiKeyConfigured) {
      return {
        model_id: model.id,
        is_available: false,
        unavailable_reason: "API key not configured",
        api_key_configured: false
      };
    }

    return {
      model_id: model.id,
      is_available: true,
      api_key_configured: true
    };
  }

  /**
   * Checks if an API key is configured in environment variables
   * Uses caching to avoid repeated environment checks
   * @param envKey - Environment variable name to check
   * @returns boolean - Whether the API key is configured
   */
  private isAPIKeyConfigured(envKey: string): boolean {
    // Check cache first
    const cached = this.apiKeyCache.get(envKey);
    const cacheExpiry = this.cacheExpiry.get(envKey);
    
    if (cached !== undefined && cacheExpiry && Date.now() < cacheExpiry) {
      return cached;
    }

    // Check environment variable
    const value = import.meta.env[envKey] || process.env[envKey];
    const isConfigured = !!(value && value.trim().length > 0);
    
    // Cache the result
    this.apiKeyCache.set(envKey, isConfigured);
    this.cacheExpiry.set(envKey, Date.now() + this.CACHE_TTL_MS);
    
    return isConfigured;
  }

  /**
   * Applies selection strategy to determine default model and sort models
   * @param models - Array of AIModelDTO to process
   * @returns AIModelDTO[] - Models with default selection applied
   */
  private applySelectionStrategy(models: AIModelDTO[]): AIModelDTO[] {
    // Filter to only available models for default selection
    const availableModels = models.filter(model => model.is_available);
    
    if (availableModels.length === 0) {
      return models; // Return all models even if none available
    }

    // Calculate scores for available models
    const scoredModels = availableModels.map(model => ({
      model,
      score: this.calculateModelScore(model)
    }));

    // Sort by score (highest first)
    scoredModels.sort((a, b) => b.score - a.score);
    
    // Mark the highest scored model as default
    const defaultModelId = scoredModels[0]?.model.id;
    
    return models.map(model => ({
      ...model,
      is_default: model.id === defaultModelId
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
    const costEfficiency = model.cost_per_1k_tokens === 0 ? 1 : 
      Math.max(0, 1 - (model.cost_per_1k_tokens / 0.02));
    score += weights.cost * costEfficiency;
    
    // Speed (invert response time - lower time = higher score)
    // Normalize by dividing by max reasonable time (5000ms)
    const speedScore = Math.max(0, 1 - (model.average_response_time_ms / 5000));
    score += weights.speed * speedScore;
    
    return score;
  }

  /**
   * Calculates statistics about available models
   * @param models - Array of AIModelDTO to analyze
   * @returns ModelStatsDTO - Calculated statistics
   */
  private calculateModelStats(models: AIModelDTO[]): ModelStatsDTO {
    const totalModels = models.length;
    const availableModels = models.filter(model => model.is_available).length;
    const freeModels = models.filter(model => !model.requires_api_key && model.is_available).length;
    const paidModels = models.filter(model => model.requires_api_key && model.is_available).length;

    return {
      total_models: totalModels,
      available_models: availableModels,
      free_models: freeModels,
      paid_models: paidModels
    };
  }

  /**
   * Clears the API key cache (useful for testing or configuration changes)
   */
  public clearCache(): void {
    this.apiKeyCache.clear();
    this.cacheExpiry.clear();
  }
} 