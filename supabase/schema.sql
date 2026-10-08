-- =====================================================================
-- BugWug — Supabase Database Setup
-- Run this in your Supabase Project -> SQL Editor -> New Query -> Run
-- =====================================================================

-- 1. Create table for storing player save states
create table if not exists public.player_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.player_saves enable row level security;

-- 3. Policy: Users can only read their own save data
drop policy if exists "Users can read own save data" on public.player_saves;
create policy "Users can read own save data"
  on public.player_saves
  for select
  using (auth.uid() = user_id);

-- 4. Policy: Users can insert their own save data
drop policy if exists "Users can insert own save data" on public.player_saves;
create policy "Users can insert own save data"
  on public.player_saves
  for insert
  with check (auth.uid() = user_id);

-- 5. Policy: Users can update their own save data
drop policy if exists "Users can update own save data" on public.player_saves;
create policy "Users can update own save data"
  on public.player_saves
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. Policy: Users can delete their own save data
drop policy if exists "Users can delete own save data" on public.player_saves;
create policy "Users can delete own save data"
  on public.player_saves
  for delete
  using (auth.uid() = user_id);
