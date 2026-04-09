-- ==========================================
-- 10xCards MVP - Initial Database Schema
-- ==========================================
-- Purpose: Create the complete initial schema for 10xCards MVP
-- Affected: Creates all core tables, types, indexes, and RLS policies
-- Date: 2024-12-04

-- enable necessary extensions
create extension if not exists "uuid-ossp";

-- ==========================================
-- custom types
-- ==========================================

create type user_role as enum ('user', 'admin');
create type flashcard_type as enum ('manual', 'llm');
create type flashcard_status as enum ('draft', 'published', 'archived');

-- ==========================================
-- core tables
-- ==========================================

-- users table is managed by supabase auth, but we can add custom columns
-- extending auth.users with a custom profile table for additional fields
create table public.users (
  id uuid references auth.users on delete cascade not null,
  role user_role not null default 'user',
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp,
  primary key (id)
);

-- source texts for llm-generated flashcards
create table public.source_texts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null check (length(content) between 1000 and 10000),
  created_at timestamptz default current_timestamp
);

-- main flashcards table
create table public.flashcards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  source_text_id uuid references public.source_texts(id),
  front varchar(200) not null check (length(front) <= 200),
  back varchar(500) not null check (length(back) <= 500),
  creation_type flashcard_type not null,
  status flashcard_status default 'draft',
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp
);

-- categories for organizing flashcards
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  name varchar(100) not null,
  description text,
  created_at timestamptz default current_timestamp
);

-- groups for organizing flashcards
create table public.groups (
  id uuid primary key default uuid_generate_v4(),
  name varchar(100) not null,
  description text,
  created_at timestamptz default current_timestamp
);

-- flashcard performance and generation statistics
create table public.flashcard_stats (
  id uuid primary key default uuid_generate_v4(),
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  generation_time_ms integer not null check (generation_time_ms >= 0),
  token_count integer not null check (token_count >= 0),
  acceptance_rate decimal check (acceptance_rate between 0 and 1),
  created_at timestamptz default current_timestamp
);

-- ==========================================
-- junction tables for many-to-many relationships
-- ==========================================

-- flashcard to category mapping
create table public.flashcard_categories (
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz default current_timestamp,
  primary key (flashcard_id, category_id)
);

-- flashcard to group mapping
create table public.flashcard_groups (
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  created_at timestamptz default current_timestamp,
  primary key (flashcard_id, group_id)
);

-- ==========================================
-- indexes for optimal performance
-- ==========================================

-- users indexes
create index idx_users_role on public.users(role);

-- flashcards indexes - most critical for performance
create index idx_flashcards_user_id on public.flashcards(user_id);
create index idx_flashcards_status on public.flashcards(status);
create index idx_flashcards_creation_type on public.flashcards(creation_type);
create index idx_flashcards_created_at on public.flashcards(created_at);

-- source_texts indexes
create index idx_source_texts_user_id on public.source_texts(user_id);

-- flashcard_stats indexes
create index idx_flashcard_stats_flashcard_id on public.flashcard_stats(flashcard_id);
create index idx_flashcard_stats_created_at on public.flashcard_stats(created_at);

-- junction table indexes for efficient joins
create index idx_flashcard_categories_category_id on public.flashcard_categories(category_id);
create index idx_flashcard_groups_group_id on public.flashcard_groups(group_id);

-- ==========================================
-- row level security (rls) setup
-- ==========================================

-- enable rls on all tables
alter table public.users enable row level security;
-- DEVELOPMENT: Commented out RLS for main tables to ease development
-- alter table public.flashcards enable row level security;
-- alter table public.source_texts enable row level security;
-- alter table public.flashcard_stats enable row level security;
alter table public.categories enable row level security;
alter table public.groups enable row level security;
-- alter table public.flashcard_categories enable row level security;
-- alter table public.flashcard_groups enable row level security;

-- ==========================================
-- rls policies for users table
-- ==========================================

-- users can view their own profile
create policy "users can view own profile" on public.users
  for select using (auth.uid() = id);

-- users can update their own profile
create policy "users can update own profile" on public.users
  for update using (auth.uid() = id);

-- admins can view all users
create policy "admins can view all users" on public.users
  for select using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- ==========================================
-- rls policies for flashcards table - COMMENTED FOR DEVELOPMENT
-- ==========================================

-- DEVELOPMENT: Wszystkie polityki dla flashcards zakomentowane na czas developmentu
-- Odkomentuj gdy będziesz gotowy na production

-- -- users can view their own flashcards
-- create policy "users can view own flashcards" on public.flashcards
--   for select using (auth.uid() = user_id);

-- -- users can insert their own flashcards
-- create policy "users can insert own flashcards" on public.flashcards
--   for insert with check (auth.uid() = user_id);

-- -- users can update their own flashcards
-- create policy "users can update own flashcards" on public.flashcards
--   for update using (auth.uid() = user_id);

-- -- users can delete their own flashcards
-- create policy "users can delete own flashcards" on public.flashcards
--   for delete using (auth.uid() = user_id);

-- -- admins can access all flashcards
-- create policy "admins can access all flashcards" on public.flashcards
--   for all using (
--     exists (
--       select 1 from public.users
--       where id = auth.uid() and role = 'admin'
--     )
--   );

-- ==========================================
-- rls policies for source_texts table - COMMENTED FOR DEVELOPMENT
-- ==========================================

-- DEVELOPMENT: Wszystkie polityki dla source_texts zakomentowane na czas developmentu

-- -- users can view their own source texts
-- create policy "users can view own source_texts" on public.source_texts
--   for select using (auth.uid() = user_id);

-- -- users can insert their own source texts
-- create policy "users can insert own source_texts" on public.source_texts
--   for insert with check (auth.uid() = user_id);

-- -- users can delete their own source texts
-- create policy "users can delete own source_texts" on public.source_texts
--   for delete using (auth.uid() = user_id);

-- -- admins can access all source texts
-- create policy "admins can access all source_texts" on public.source_texts
--   for all using (
--     exists (
--       select 1 from public.users
--       where id = auth.uid() and role = 'admin'
--     )
--   );

-- ==========================================
-- rls policies for flashcard_stats table - COMMENTED FOR DEVELOPMENT
-- ==========================================

-- DEVELOPMENT: Wszystkie polityki dla flashcard_stats zakomentowane na czas developmentu

-- -- users can view stats for their own flashcards
-- create policy "users can view own flashcard_stats" on public.flashcard_stats
--   for select using (
--     exists (
--       select 1 from public.flashcards
--       where id = flashcard_id and user_id = auth.uid()
--     )
--   );

-- -- users can insert stats for their own flashcards
-- create policy "users can insert own flashcard_stats" on public.flashcard_stats
--   for insert with check (
--     exists (
--       select 1 from public.flashcards
--       where id = flashcard_id and user_id = auth.uid()
--     )
--   );

-- -- admins can access all flashcard stats
-- create policy "admins can access all flashcard_stats" on public.flashcard_stats
--   for all using (
--     exists (
--       select 1 from public.users
--       where id = auth.uid() and role = 'admin'
--     )
--   );

-- ==========================================
-- rls policies for categories (public access)
-- ==========================================

-- anyone can view categories
create policy "anyone can view categories" on public.categories
  for select using (true);

-- authenticated users can insert categories
create policy "authenticated users can insert categories" on public.categories
  for insert to authenticated with check (true);

-- authenticated users can update categories
create policy "authenticated users can update categories" on public.categories
  for update to authenticated using (true);

-- admins can delete categories
create policy "admins can delete categories" on public.categories
  for delete using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- ==========================================
-- rls policies for groups (public access)
-- ==========================================

-- anyone can view groups
create policy "anyone can view groups" on public.groups
  for select using (true);

-- authenticated users can insert groups
create policy "authenticated users can insert groups" on public.groups
  for insert to authenticated with check (true);

-- authenticated users can update groups
create policy "authenticated users can update groups" on public.groups
  for update to authenticated using (true);

-- admins can delete groups
create policy "admins can delete groups" on public.groups
  for delete using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- ==========================================
-- rls policies for flashcard_categories junction table - COMMENTED FOR DEVELOPMENT
-- ==========================================

-- DEVELOPMENT: Wszystkie polityki dla flashcard_categories zakomentowane na czas developmentu

-- -- users can view categories for their own flashcards
-- create policy "users can view own flashcard_categories" on public.flashcard_categories
--   for select using (
--     exists (
--       select 1 from public.flashcards
--       where id = flashcard_id and user_id = auth.uid()
--     )
--   );

-- -- users can assign categories to their own flashcards
-- create policy "users can insert own flashcard_categories" on public.flashcard_categories
--   for insert with check (
--     exists (
--       select 1 from public.flashcards
--       where id = flashcard_id and user_id = auth.uid()
--     )
--   );

-- -- users can remove categories from their own flashcards
-- create policy "users can delete own flashcard_categories" on public.flashcard_categories
--   for delete using (
--     exists (
--       select 1 from public.flashcards
--       where id = flashcard_id and user_id = auth.uid()
--     )
--   );

-- ==========================================
-- rls policies for flashcard_groups junction table - COMMENTED FOR DEVELOPMENT
-- ==========================================

-- DEVELOPMENT: Wszystkie polityki dla flashcard_groups zakomentowane na czas developmentu

-- -- users can view groups for their own flashcards
-- create policy "users can view own flashcard_groups" on public.flashcard_groups
--   for select using (
--     exists (
--       select 1 from public.flashcards
--       where id = flashcard_id and user_id = auth.uid()
--     )
--   );

-- -- users can assign groups to their own flashcards
-- create policy "users can insert own flashcard_groups" on public.flashcard_groups
--   for insert with check (
--     exists (
--       select 1 from public.flashcards
--       where id = flashcard_id and user_id = auth.uid()
--     )
--   );

-- -- users can remove groups from their own flashcards
-- create policy "users can delete own flashcard_groups" on public.flashcard_groups
--   for delete using (
--     exists (
--       select 1 from public.flashcards
--       where id = flashcard_id and user_id = auth.uid()
--     )
--   );

-- ==========================================
-- triggers for automatic timestamp updates
-- ==========================================

-- function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = current_timestamp;
  return new;
end;
$$ language plpgsql;

-- apply updated_at trigger to relevant tables
create trigger handle_users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger handle_flashcards_updated_at
  before update on public.flashcards
  for each row execute function public.handle_updated_at();

-- ==========================================
-- create initial admin user trigger
-- ==========================================

-- function to create user profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, role)
  values (new.id, 'user');
  return new;
end;
$$ language plpgsql security definer;

-- trigger to create user profile on auth signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==========================================
-- end of migration
-- ========================================== 