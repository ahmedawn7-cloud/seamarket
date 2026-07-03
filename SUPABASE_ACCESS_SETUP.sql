-- ProfitPilot AI access setup
-- Run this in Supabase SQL Editor for the active project.

create extension if not exists pgcrypto;

alter table public."MYProductScout_Master" enable row level security;

drop policy if exists "Public read products" on public."MYProductScout_Master";
create policy "Public read products"
on public."MYProductScout_Master"
for select
using (true);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  business_type text,
  country text default 'Malaysia',
  reward_points integer default 0,
  plan text default 'registered',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "Users view own profile" on public.user_profiles;
create policy "Users view own profile"
on public.user_profiles
for select
using (auth.uid() = id);

drop policy if exists "Users insert own profile" on public.user_profiles;
create policy "Users insert own profile"
on public.user_profiles
for insert
with check (auth.uid() = id);

drop policy if exists "Users update own profile" on public.user_profiles;
create policy "Users update own profile"
on public.user_profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  role text,
  goal text,
  source text default 'homepage',
  created_at timestamptz default now()
);

alter table public.waitlist enable row level security;

drop policy if exists "Anyone can join waitlist" on public.waitlist;
create policy "Anyone can join waitlist"
on public.waitlist
for insert
with check (true);

create table if not exists public.user_watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  product_id text not null,
  snapshot jsonb,
  notes text,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

alter table public.user_watchlist enable row level security;

drop policy if exists "Users view own watchlist" on public.user_watchlist;
create policy "Users view own watchlist"
on public.user_watchlist
for select
using (auth.uid() = user_id);

drop policy if exists "Users insert own watchlist" on public.user_watchlist;
create policy "Users insert own watchlist"
on public.user_watchlist
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users update own watchlist" on public.user_watchlist;
create policy "Users update own watchlist"
on public.user_watchlist
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users delete own watchlist" on public.user_watchlist;
create policy "Users delete own watchlist"
on public.user_watchlist
for delete
using (auth.uid() = user_id);
