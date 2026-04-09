-- ==========================================
-- Add user_id columns to categories and groups
-- ==========================================
-- Purpose: Add user_id foreign key columns to categories and groups tables
-- Date: 2025-01-03
-- Affected tables: categories, groups
-- Special considerations: Adds foreign key constraints and indexes

-- ==========================================
-- Add user_id column to categories table
-- ==========================================

-- Add user_id column to categories
alter table public.categories 
add column if not exists user_id uuid references public.users(id) on delete cascade;

-- Create index for performance
create index if not exists idx_categories_user_id on public.categories(user_id);

-- Update existing categories to have a default user (if any exist)
-- This is safe because we're in development
update public.categories 
set user_id = (select id from public.users limit 1)
where user_id is null;

-- Make user_id not null after setting default values
alter table public.categories 
alter column user_id set not null;

-- ==========================================
-- Add user_id column to groups table
-- ==========================================

-- Add user_id column to groups
alter table public.groups 
add column if not exists user_id uuid references public.users(id) on delete cascade;

-- Create index for performance
create index if not exists idx_groups_user_id on public.groups(user_id);

-- Update existing groups to have a default user (if any exist)
-- This is safe because we're in development
update public.groups 
set user_id = (select id from public.users limit 1)
where user_id is null;

-- Make user_id not null after setting default values
alter table public.groups 
alter column user_id set not null;

-- ==========================================
-- Update RLS policies (if enabled)
-- ==========================================

-- Note: RLS is currently disabled for development
-- When enabled, add policies like:
-- create policy "Users can only see their own categories" on public.categories
--   for select using (auth.uid() = user_id);
-- create policy "Users can only see their own groups" on public.groups
--   for select using (auth.uid() = user_id); 