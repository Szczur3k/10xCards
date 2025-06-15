-- Migration: Create rate_limit_records table for rate limiting functionality
-- Purpose: Store rate limiting attempts for API endpoints
-- Affected tables: rate_limit_records (new)
-- Special considerations: Automatic cleanup of old records, indexes for performance

-- create rate_limit_records table for storing rate limiting data
create table if not exists public.rate_limit_records (
  id uuid primary key default gen_random_uuid(),
  ip varchar(45) not null, -- supports both ipv4 and ipv6
  endpoint varchar(100) not null, -- api endpoint identifier
  attempts integer not null default 1,
  window_start timestamptz not null,
  created_at timestamptz not null default now()
);

-- enable row level security on rate_limit_records table
alter table public.rate_limit_records enable row level security;

-- create index for efficient querying by ip and time window
create index if not exists idx_rate_limit_records_ip_window 
on public.rate_limit_records (ip, window_start);

-- create index for efficient cleanup of old records
create index if not exists idx_rate_limit_records_window_start 
on public.rate_limit_records (window_start);

-- create index for endpoint-specific queries
create index if not exists idx_rate_limit_records_endpoint 
on public.rate_limit_records (endpoint);

-- rls policy for anon users - allow insert and select for rate limiting
-- rationale: anon users need to check and record their rate limit attempts
create policy "anon_users_can_manage_rate_limits" 
on public.rate_limit_records 
for all 
to anon 
using (true) 
with check (true);

-- rls policy for authenticated users - allow insert and select for rate limiting
-- rationale: authenticated users need to check and record their rate limit attempts
create policy "authenticated_users_can_manage_rate_limits" 
on public.rate_limit_records 
for all 
to authenticated 
using (true) 
with check (true);

-- create function to automatically cleanup old rate limit records
-- this function will be called periodically to remove records older than 24 hours
create or replace function cleanup_old_rate_limit_records()
returns void
language plpgsql
security definer
as $$
begin
  -- delete records older than 24 hours
  delete from public.rate_limit_records 
  where window_start < now() - interval '24 hours';
end;
$$;

-- grant execute permission on cleanup function
grant execute on function cleanup_old_rate_limit_records() to anon, authenticated;

-- create a trigger to automatically cleanup old records when new ones are inserted
-- this ensures the table doesn't grow indefinitely
create or replace function trigger_cleanup_rate_limit_records()
returns trigger
language plpgsql
as $$
begin
  -- randomly cleanup old records (1% chance) to avoid performance impact
  if random() < 0.01 then
    perform cleanup_old_rate_limit_records();
  end if;
  
  return new;
end;
$$;

-- create trigger that fires after insert
create trigger cleanup_rate_limit_records_trigger
  after insert on public.rate_limit_records
  for each row
  execute function trigger_cleanup_rate_limit_records(); 