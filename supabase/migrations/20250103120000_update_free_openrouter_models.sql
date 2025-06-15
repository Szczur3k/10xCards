-- ==========================================
-- Add Latest Free OpenRouter Models
-- ==========================================
-- Purpose: Add latest free models from OpenRouter with :free suffix
-- Date: 2025-06-15
-- Affected tables: ai_models
-- Special considerations: Adds current working free models

-- ==========================================
-- Clear all existing models to start fresh
-- ==========================================

-- Remove all existing models for clean reset
DELETE FROM public.ai_models;

-- ==========================================
-- Insert Latest Free Models (June 2025)
-- ==========================================

INSERT INTO public.ai_models (
  id, name, provider, cost_per_1k_tokens, max_tokens, average_response_time_ms, 
  quality_score, recommended_for, requires_api_key, is_active
) VALUES
-- DeepSeek models with :free suffix
(
  'deepseek/deepseek-r1-0528-qwen3-8b:free',
  'DeepSeek R1 Qwen3 8B (Free)',
  'openrouter',
  0.0,
  8192,
  2000,
  0.90,
  ARRAY['flashcards', 'education', 'reasoning', 'default'],
  true,
  true
),
(
  'deepseek/deepseek-r1-0528:free', 
  'DeepSeek R1 0528 (Free)',
  'openrouter',
  0.0,
  8192,
  1800,
  0.88,
  ARRAY['flashcards', 'education', 'reasoning'],
  true,
  true
),
-- Sarvam AI (free)
(
  'sarvamai/sarvam-m:free',
  'Sarvam M (Free)',
  'openrouter',
  0.0,
  4096,
  1500,
  0.82,
  ARRAY['flashcards', 'lightweight'],
  true,
  true
),
-- Mistral DevStral (free)
(
  'mistralai/devstral-small:free',
  'Mistral DevStral Small (Free)',
  'openrouter',
  0.0,
  8192,
  1600,
  0.85,
  ARRAY['flashcards', 'education', 'coding'],
  true,
  true
),
-- Google Gemma 3 (free)
(
  'google/gemma-3n-e4b-it:free',
  'Google Gemma 3N E4B IT (Free)',
  'openrouter',
  0.0,
  8192,
  1700,
  0.87,
  ARRAY['flashcards', 'education', 'instruction-following'],
  true,
  true
),
-- Meta Llama 3.3 (free)
(
  'meta-llama/llama-3.3-8b-instruct:free',
  'Meta Llama 3.3 8B Instruct (Free)',
  'openrouter',
  0.0,
  8192,
  1400,
  0.86,
  ARRAY['flashcards', 'education'],
  true,
  true
),
-- Microsoft Phi-4 (free)
(
  'microsoft/phi-4-reasoning-plus:free',
  'Microsoft Phi-4 Reasoning Plus (Free)',
  'openrouter',
  0.0,
  16384,
  1300,
  0.89,
  ARRAY['flashcards', 'education', 'reasoning'],
  true,
  true
);

-- ==========================================
-- Set default model for flashcard generation
-- ==========================================

-- DeepSeek R1 Qwen3 8B is set as default (highest quality free model)
-- Already included 'default' in recommended_for array above

-- ==========================================
-- Verification
-- ==========================================

-- Verify all models are inserted correctly
SELECT 
  id, 
  name, 
  cost_per_1k_tokens, 
  quality_score, 
  recommended_for,
  is_active
FROM public.ai_models 
WHERE cost_per_1k_tokens = 0.0 
ORDER BY quality_score DESC; 