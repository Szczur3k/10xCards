import type { ModelConfigDTO } from '../../types';

/**
 * Comprehensive configuration of all available AI models
 * Includes both free (no API key required) and paid models (require API keys)
 */
export const AI_MODELS_CONFIG: ModelConfigDTO[] = [
  // Free Models via OpenRouter - No API key required
  {
    id: "meta-llama/llama-3.1-8b-instruct:free",
    name: "Llama 3.1 8B (Free)",
    provider: "openrouter",
    cost_per_1k_tokens: 0.0,
    max_tokens: 4096,
    average_response_time_ms: 2000,
    quality_score: 0.88,
    recommended_for: ["general", "reasoning", "free"],
    requires_api_key: false,
    env_key: null,
    is_free: true
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    name: "Llama 3.3 70B (Free)",
    provider: "openrouter",
    cost_per_1k_tokens: 0.0,
    max_tokens: 4096,
    average_response_time_ms: 3500,
    quality_score: 0.92,
    recommended_for: ["complex", "reasoning", "quality"],
    requires_api_key: false,
    env_key: null,
    is_free: true
  },
  {
    id: "qwen/qwen3-30b-a3b:free",
    name: "Qwen3 30B A3B (Free)",
    provider: "openrouter",
    cost_per_1k_tokens: 0.0,
    max_tokens: 40960,
    average_response_time_ms: 2800,
    quality_score: 0.90,
    recommended_for: ["reasoning", "multilingual", "long-context"],
    requires_api_key: false,
    env_key: null,
    is_free: true
  },
  {
    id: "mistralai/mistral-7b-instruct:free",
    name: "Mistral 7B (Free)",
    provider: "openrouter",
    cost_per_1k_tokens: 0.0,
    max_tokens: 4096,
    average_response_time_ms: 1800,
    quality_score: 0.85,
    recommended_for: ["speed", "general", "multilingual"],
    requires_api_key: false,
    env_key: null,
    is_free: true
  },
  {
    id: "google/gemma-2-9b-it:free",
    name: "Gemma 2 9B (Free)",
    provider: "openrouter",
    cost_per_1k_tokens: 0.0,
    max_tokens: 4096,
    average_response_time_ms: 2200,
    quality_score: 0.83,
    recommended_for: ["general", "instruction-following", "google"],
    requires_api_key: false,
    env_key: null,
    is_free: true
  },
  {
    id: "deepseek/deepseek-r1:free",
    name: "DeepSeek R1 (Free)",
    provider: "openrouter",
    cost_per_1k_tokens: 0.0,
    max_tokens: 4096,
    average_response_time_ms: 3000,
    quality_score: 0.89,
    recommended_for: ["reasoning", "thinking", "complex"],
    requires_api_key: false,
    env_key: null,
    is_free: true
  },

  // OpenRouter Paid Models - Require OPENROUTER_API_KEY
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openrouter",
    cost_per_1k_tokens: 0.00015,
    max_tokens: 4096,
    average_response_time_ms: 1200,
    quality_score: 0.92,
    recommended_for: ["general", "academic", "quality"],
    requires_api_key: true,
    env_key: "OPENROUTER_API_KEY",
    is_free: false
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "openrouter",
    cost_per_1k_tokens: 0.005,
    max_tokens: 4096,
    average_response_time_ms: 2000,
    quality_score: 0.95,
    recommended_for: ["complex", "research", "premium"],
    requires_api_key: true,
    env_key: "OPENROUTER_API_KEY",
    is_free: false
  },
  {
    id: "openai/gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "openrouter",
    cost_per_1k_tokens: 0.0005,
    max_tokens: 4096,
    average_response_time_ms: 800,
    quality_score: 0.88,
    recommended_for: ["speed", "cost-effective", "general"],
    requires_api_key: true,
    env_key: "OPENROUTER_API_KEY",
    is_free: false
  },

  // More OpenRouter Paid Models
  {
    id: "anthropic/claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "openrouter",
    cost_per_1k_tokens: 0.00025,
    max_tokens: 4096,
    average_response_time_ms: 1800,
    quality_score: 0.89,
    recommended_for: ["creative", "language", "reasoning"],
    requires_api_key: true,
    env_key: "OPENROUTER_API_KEY",
    is_free: false
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "openrouter",
    cost_per_1k_tokens: 0.003,
    max_tokens: 4096,
    average_response_time_ms: 2200,
    quality_score: 0.93,
    recommended_for: ["analysis", "writing", "complex"],
    requires_api_key: true,
    env_key: "OPENROUTER_API_KEY",
    is_free: false
  },
  {
    id: "google/gemini-pro-1.5",
    name: "Gemini Pro 1.5",
    provider: "openrouter",
    cost_per_1k_tokens: 0.00125,
    max_tokens: 8192,
    average_response_time_ms: 2500,
    quality_score: 0.91,
    recommended_for: ["long-context", "advanced", "multimodal"],
    requires_api_key: true,
    env_key: "OPENROUTER_API_KEY",
    is_free: false
  },
  {
    id: "mistralai/mixtral-8x7b-instruct",
    name: "Mixtral 8x7B",
    provider: "openrouter",
    cost_per_1k_tokens: 0.00024,
    max_tokens: 4096,
    average_response_time_ms: 1800,
    quality_score: 0.84,
    recommended_for: ["cost-effective", "multilingual", "general"],
    requires_api_key: true,
    env_key: "OPENROUTER_API_KEY",
    is_free: false
  },
  {
    id: "meta-llama/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B",
    provider: "openrouter",
    cost_per_1k_tokens: 0.00088,
    max_tokens: 4096,
    average_response_time_ms: 2200,
    quality_score: 0.90,
    recommended_for: ["reasoning", "complex", "open-source"],
    requires_api_key: true,
    env_key: "OPENROUTER_API_KEY",
    is_free: false
  }
];

/**
 * Default model selection strategy configuration
 */
export const DEFAULT_SELECTION_STRATEGY = {
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
export const API_KEY_ENV_MAP = {
  openrouter: "OPENROUTER_API_KEY"
} as const;

/**
 * Provider display names
 */
export const PROVIDER_NAMES = {
  openrouter: "OpenRouter"
} as const; 