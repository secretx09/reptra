-- Reptra Session 81 backend foundation.
-- Run this in the Supabase SQL editor after creating a project.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  username text unique,
  bio text,
  training_focus text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
add column if not exists bio text;

alter table public.profiles
add column if not exists training_focus text;

create table if not exists public.cloud_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  record_type text not null check (
    record_type in (
      'workout',
      'routine',
      'custom_exercise',
      'progress_photo',
      'settings',
      'training_split',
      'favorite_exercise'
    )
  ),
  local_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, record_type, local_id)
);

alter table public.profiles enable row level security;
alter table public.cloud_records enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Authenticated users can check public usernames" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can read their own cloud records" on public.cloud_records;
drop policy if exists "Users can insert their own cloud records" on public.cloud_records;
drop policy if exists "Users can update their own cloud records" on public.cloud_records;
drop policy if exists "Users can delete their own cloud records" on public.cloud_records;

create policy "Users can read their own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Authenticated users can check public usernames"
on public.profiles for select
using (auth.role() = 'authenticated');

create policy "Users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can read their own cloud records"
on public.cloud_records for select
using (auth.uid() = user_id);

create policy "Users can insert their own cloud records"
on public.cloud_records for insert
with check (auth.uid() = user_id);

create policy "Users can update their own cloud records"
on public.cloud_records for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own cloud records"
on public.cloud_records for delete
using (auth.uid() = user_id);

create index if not exists cloud_records_user_type_updated_idx
on public.cloud_records (user_id, record_type, updated_at desc);
