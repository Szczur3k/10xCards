-- ==========================================
-- Add AI Models Table and Seed Data
-- ==========================================
-- Purpose: Create ai_models table and populate with initial model configurations
-- Date: 2024-12-30

-- ==========================================
-- AI Models Table
-- ==========================================

create table public.ai_models (
  id varchar(100) primary key, -- Model ID like "meta-llama/llama-3.1-8b-instruct:free"
  name varchar(200) not null,
  provider varchar(50) not null,
  cost_per_1k_tokens decimal(10,6) not null default 0.0,
  max_tokens integer not null check (max_tokens > 0),
  average_response_time_ms integer not null check (average_response_time_ms > 0),
  quality_score decimal(3,2) not null check (quality_score between 0 and 1),
  recommended_for text[] not null default '{}',
  requires_api_key boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp
);

-- ==========================================
-- Indexes for AI Models
-- ==========================================

create index idx_ai_models_provider on public.ai_models(provider);
create index idx_ai_models_requires_api_key on public.ai_models(requires_api_key);
create index idx_ai_models_is_active on public.ai_models(is_active);
create index idx_ai_models_quality_score on public.ai_models(quality_score);

-- ==========================================
-- RLS for AI Models (disabled for development)
-- ==========================================

-- DEVELOPMENT: RLS disabled for easier development
-- alter table public.ai_models enable row level security;

-- ==========================================
-- Seed AI Models Data
-- ==========================================

-- Free Models
insert into public.ai_models (
  id, name, provider, cost_per_1k_tokens, max_tokens, average_response_time_ms, 
  quality_score, recommended_for, requires_api_key, is_active
) values
-- Free Models via OpenRouter
(
  'meta-llama/llama-3.1-8b-instruct:free',
  'Llama 3.1 8B (Free)',
  'openrouter',
  0.0,
  4096,
  2000,
  0.88,
  ARRAY['general', 'reasoning', 'free'],
  false,
  true
),
(
  'meta-llama/llama-3.3-70b-instruct:free',
  'Llama 3.3 70B (Free)',
  'openrouter',
  0.0,
  4096,
  3500,
  0.92,
  ARRAY['complex', 'reasoning', 'quality'],
  false,
  true
),
(
  'qwen/qwen3-30b-a3b:free',
  'Qwen3 30B A3B (Free)',
  'openrouter',
  0.0,
  40960,
  2800,
  0.90,
  ARRAY['reasoning', 'multilingual', 'long-context'],
  false,
  true
),
(
  'mistralai/mistral-7b-instruct:free',
  'Mistral 7B (Free)',
  'openrouter',
  0.0,
  4096,
  1800,
  0.85,
  ARRAY['speed', 'general', 'multilingual'],
  false,
  true
),
(
  'google/gemma-2-9b-it:free',
  'Gemma 2 9B (Free)',
  'openrouter',
  0.0,
  4096,
  2200,
  0.83,
  ARRAY['general', 'instruction-following', 'google'],
  false,
  true
),
(
  'deepseek/deepseek-r1:free',
  'DeepSeek R1 (Free)',
  'openrouter',
  0.0,
  4096,
  3000,
  0.89,
  ARRAY['reasoning', 'thinking', 'complex'],
  false,
  true
),
-- Paid Models (require API keys)
(
  'openai/gpt-4o-mini',
  'GPT-4o Mini',
  'openrouter',
  0.00015,
  4096,
  1200,
  0.92,
  ARRAY['general', 'academic', 'quality'],
  true,
  true
),
(
  'openai/gpt-4o',
  'GPT-4o',
  'openrouter',
  0.005,
  4096,
  2000,
  0.95,
  ARRAY['complex', 'research', 'premium'],
  true,
  true
),
(
  'anthropic/claude-3.5-sonnet',
  'Claude 3.5 Sonnet',
  'openrouter',
  0.003,
  4096,
  2200,
  0.93,
  ARRAY['analysis', 'writing', 'complex'],
  true,
  true
);

-- ==========================================
-- Update trigger for ai_models
-- ==========================================

create trigger handle_ai_models_updated_at
  before update on public.ai_models
  for each row execute function public.handle_updated_at(); 