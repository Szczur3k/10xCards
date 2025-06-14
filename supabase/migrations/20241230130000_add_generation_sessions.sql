-- ==========================================
-- Add Generation Sessions Table
-- ==========================================
-- Purpose: Track AI generation progress for real-time updates
-- Date: 2024-12-30

-- ==========================================
-- Generation Sessions Table
-- ==========================================

create table public.generation_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  source_text_id uuid references public.source_texts(id) on delete cascade,
  status varchar(20) not null default 'generating' check (status in ('generating', 'completed', 'error')),
  total_flashcards integer not null check (total_flashcards > 0),
  current_flashcards integer not null default 0 check (current_flashcards >= 0),
  model_used varchar(100),
  request_data jsonb not null, -- Store original request
  result_data jsonb, -- Store final result when completed
  error_message text,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp,
  completed_at timestamptz
);

-- ==========================================
-- Indexes for Generation Sessions
-- ==========================================

create index idx_generation_sessions_user_id on public.generation_sessions(user_id);
create index idx_generation_sessions_status on public.generation_sessions(status);
create index idx_generation_sessions_created_at on public.generation_sessions(created_at);
create index idx_generation_sessions_source_text_id on public.generation_sessions(source_text_id);

-- ==========================================
-- RLS for Generation Sessions
-- ==========================================

-- DEVELOPMENT: RLS disabled for easier development
-- alter table public.generation_sessions enable row level security;

-- ==========================================
-- Trigger to update updated_at timestamp
-- ==========================================

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = current_timestamp;
  if new.status = 'completed' and old.status != 'completed' then
    new.completed_at = current_timestamp;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger update_generation_sessions_updated_at
  before update on public.generation_sessions
  for each row
  execute function public.update_updated_at_column(); 