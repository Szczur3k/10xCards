import type { Database, Tables, TablesInsert, TablesUpdate, Enums } from './db/database.types';

// ============================================================================
// BASE ENTITY TYPES (derived from database models)
// ============================================================================

export type User = Tables<'users'>;
export type Flashcard = Tables<'flashcards'>;
export type Category = Tables<'categories'>;
export type Group = Tables<'groups'>;
export type SourceText = Tables<'source_texts'>;
export type FlashcardStats = Tables<'flashcard_stats'>;

// Database Insert/Update types
export type FlashcardInsert = TablesInsert<'flashcards'>;
export type FlashcardUpdate = TablesUpdate<'flashcards'>;
export type CategoryInsert = TablesInsert<'categories'>;
export type CategoryUpdate = TablesUpdate<'categories'>;
export type GroupInsert = TablesInsert<'groups'>;
export type GroupUpdate = TablesUpdate<'groups'>;
export type SourceTextInsert = TablesInsert<'source_texts'>;

// Enum types
export type FlashcardStatus = Enums<'flashcard_status'>;
export type FlashcardType = Enums<'flashcard_type'>;
export type UserRole = Enums<'user_role'>;

// ============================================================================
// COMMON DTOs
// ============================================================================

export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ErrorResponseDTO {
  error: string;
  message: string;
  details?: Record<string, string[]>;
}

// ============================================================================
// AUTHENTICATION DTOs
// ============================================================================

export interface SignupRequestDTO {
  email: string;
  password: string;
}

export interface SigninRequestDTO {
  email: string;
  password: string;
}

export interface UserDTO {
  id: string;
  email: string;
  email_verified: boolean;
  role: UserRole;
  created_at: string;
}

export interface SessionDTO {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponseDTO {
  user: UserDTO;
  session: SessionDTO;
}

// ============================================================================
// CATEGORY DTOs
// ============================================================================

export interface CategoryDTO {
  id: string;
  name: string;
  description: string | null;
  flashcard_count: number;
  created_at: string | null;
}

export interface CategoryListResponseDTO {
  data: CategoryDTO[];
}

export interface CreateCategoryRequestDTO {
  name: string;
  description?: string;
}

export interface UpdateCategoryRequestDTO {
  name?: string;
  description?: string;
}

// ============================================================================
// GROUP DTOs
// ============================================================================

export interface GroupDTO {
  id: string;
  name: string;
  description: string | null;
  flashcard_count: number;
  created_at: string | null;
}

export interface GroupListResponseDTO {
  data: GroupDTO[];
}

export interface CreateGroupRequestDTO {
  name: string;
  description?: string;
}

export interface UpdateGroupRequestDTO {
  name?: string;
  description?: string;
}

// ============================================================================
// FLASHCARD DTOs
// ============================================================================

export interface FlashcardDTO {
  id: string;
  front: string;
  back: string;
  creation_type: FlashcardType;
  status: FlashcardStatus | null;
  source_text_id: string | null;
  categories: Pick<CategoryDTO, 'id' | 'name'>[];
  groups: Pick<GroupDTO, 'id' | 'name'>[];
  created_at: string | null;
  updated_at: string | null;
}

export interface FlashcardListResponseDTO {
  data: FlashcardDTO[];
  pagination: PaginationDTO;
}

export interface CreateFlashcardRequestDTO {
  front: string;
  back: string;
  status?: FlashcardStatus;
  category_ids?: string[];
  group_ids?: string[];
}

export interface UpdateFlashcardRequestDTO {
  front?: string;
  back?: string;
  status?: FlashcardStatus;
  category_ids?: string[];
  group_ids?: string[];
}

// AI Generation DTOs
export interface GenerateFlashcardsRequestDTO {
  source_text: string;
  max_flashcards?: number;
  model?: string;
  category_ids?: string[];
  group_ids?: string[];
}

export interface GeneratedFlashcardDTO {
  id: string;
  front: string;
  back: string;
  creation_type: 'llm';
  status: 'draft';
  confidence_score: number;
  generation_time_ms: number;
}

export interface GenerationStatsDTO {
  total_generated: number;
  total_time_ms: number;
  average_time_per_card_ms: number;
  total_tokens: number;
  model_used: string;
}

export interface GenerateFlashcardsResponseDTO {
  source_text_id: string;
  model_used: string;
  flashcards: GeneratedFlashcardDTO[];
  stats: GenerationStatsDTO;
}

// AI Model DTOs
export interface AIModelDTO {
  id: string;
  name: string;
  provider: string;
  cost_per_1k_tokens: number;
  max_tokens: number;
  average_response_time_ms: number;
  quality_score: number;
  recommended_for: string[];
  is_default: boolean;
}

export interface ModelSelectionStrategyDTO {
  criteria: string[];
  weights: {
    quality: number;
    cost: number;
    speed: number;
  };
}

export interface ModelsResponseDTO {
  models: AIModelDTO[];
  default_selection_strategy: ModelSelectionStrategyDTO;
}

// Review DTOs
export interface ReviewFlashcardRequestDTO {
  action: 'accept' | 'reject' | 'edit';
  front?: string;
  back?: string;
  status?: FlashcardStatus;
}

// ============================================================================
// SOURCE TEXT DTOs
// ============================================================================

export interface SourceTextDTO {
  id: string;
  content: string;
  flashcard_count: number;
  created_at: string | null;
}

export interface SourceTextListResponseDTO {
  data: SourceTextDTO[];
  pagination: PaginationDTO;
}

export interface SourceTextDetailDTO {
  id: string;
  content: string;
  flashcards: Pick<FlashcardDTO, 'id' | 'front' | 'back' | 'status'>[];
  created_at: string | null;
}

// ============================================================================
// STATISTICS DTOs
// ============================================================================

export interface CardsByStatusDTO {
  draft: number;
  published: number;
  archived: number;
}

export interface PeriodStatsDTO {
  cards_created: number;
  ai_generations: number;
  manual_creations: number;
}

export interface StatsOverviewResponseDTO {
  total_flashcards: number;
  total_ai_generated: number;
  total_manual: number;
  average_generation_time_ms: number;
  total_tokens_used: number;
  acceptance_rate: number;
  cards_by_status: CardsByStatusDTO;
  period_stats: PeriodStatsDTO;
}

export interface AcceptanceRatesDTO {
  overall: number;
  by_model: Record<string, number>;
}

export interface TimeSeriesDataDTO {
  date: string;
  generations: number;
  cards_generated: number;
  acceptance_rate: number;
}

export interface GenerationStatsResponseDTO {
  total_generations: number;
  total_cards_generated: number;
  average_cards_per_generation: number;
  average_time_per_card_ms: number;
  total_tokens_used: number;
  acceptance_rates: AcceptanceRatesDTO;
  time_series: TimeSeriesDataDTO[];
}

// ============================================================================
// QUERY PARAMETER TYPES
// ============================================================================

export interface FlashcardQueryParams {
  page?: number;
  limit?: number;
  status?: FlashcardStatus;
  creation_type?: FlashcardType;
  category_id?: string;
  group_id?: string;
  sort?: 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
}

export interface SourceTextQueryParams {
  page?: number;
  limit?: number;
}

export interface StatsQueryParams {
  period?: 'day' | 'week' | 'month' | 'year';
}

// ============================================================================
// COMMAND MODELS (for internal operations)
// ============================================================================

export interface CreateFlashcardCommand {
  front: string;
  back: string;
  creation_type: FlashcardType;
  status: FlashcardStatus;
  user_id: string;
  source_text_id?: string;
  category_ids?: string[];
  group_ids?: string[];
}

export interface UpdateFlashcardCommand {
  id: string;
  user_id: string;
  front?: string;
  back?: string;
  status?: FlashcardStatus;
  category_ids?: string[];
  group_ids?: string[];
}

export interface GenerateFlashcardsCommand {
  source_text: string;
  user_id: string;
  max_flashcards: number;
  model?: string;
  category_ids?: string[];
  group_ids?: string[];
}

export interface CreateCategoryCommand {
  name: string;
  description?: string;
}

export interface UpdateCategoryCommand {
  id: string;
  name?: string;
  description?: string;
}

export interface CreateGroupCommand {
  name: string;
  description?: string;
}

export interface UpdateGroupCommand {
  id: string;
  name?: string;
  description?: string;
}

export interface CreateSourceTextCommand {
  content: string;
  user_id: string;
}

export interface RecordFlashcardStatsCommand {
  flashcard_id: string;
  generation_time_ms: number;
  token_count: number;
  acceptance_rate?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

// Type for creating flashcards from database insert with required user_id
export type CreateFlashcardData = Omit<FlashcardInsert, 'user_id'> & {
  user_id: string;
};

// Type for API responses with standard structure
export interface ApiResponse<T = any> {
  data?: T;
  error?: ErrorResponseDTO;
  pagination?: PaginationDTO;
}

// Type guards and validation helpers
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>; 