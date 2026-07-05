create extension if not exists pgcrypto;

create table if not exists public.community_contributor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  total_points integer not null default 0,
  submitted_count integer not null default 0,
  approved_count integer not null default 0,
  rejected_count integer not null default 0,
  duplicate_count integer not null default 0,
  needs_info_count integer not null default 0,
  featured_count integer not null default 0,
  sent_to_product_ops_count integer not null default 0,
  current_rank text not null default 'New Scout',
  badges jsonb not null default '[]'::jsonb,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_product_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  contributor_profile_id uuid references public.community_contributor_profiles(id) on delete set null,
  product_name text not null,
  platform_found_on text not null,
  product_url text,
  image_url text,
  category text,
  price_rm numeric,
  approximate_sales numeric,
  why_trending text not null,
  source_keyword text,
  notes text,
  status text not null default 'pending_review',
  admin_feedback text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  points_awarded integer not null default 0,
  duplicate_of uuid references public.community_product_recommendations(id) on delete set null,
  featured boolean not null default false,
  sent_to_product_ops boolean not null default false,
  product_intake_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_product_recommendations_status_check check (
    status in ('pending_review', 'approved', 'rejected', 'duplicate', 'needs_info', 'featured', 'sent_to_product_ops', 'archived')
  )
);

create table if not exists public.community_contribution_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  contributor_profile_id uuid references public.community_contributor_profiles(id) on delete set null,
  recommendation_id uuid references public.community_product_recommendations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  points_change integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.community_contributor_profiles add column if not exists needs_info_count integer not null default 0;
alter table public.community_contributor_profiles add column if not exists last_activity_at timestamptz;
alter table public.community_product_recommendations add column if not exists contributor_profile_id uuid references public.community_contributor_profiles(id) on delete set null;
alter table public.community_product_recommendations add column if not exists approximate_sales numeric;
alter table public.community_product_recommendations add column if not exists source_keyword text;
alter table public.community_product_recommendations add column if not exists sent_to_product_ops boolean not null default false;
alter table public.community_product_recommendations add column if not exists product_intake_id uuid;
alter table public.community_contribution_activity_logs add column if not exists contributor_profile_id uuid references public.community_contributor_profiles(id) on delete set null;
alter table public.community_contribution_activity_logs add column if not exists actor_user_id uuid references auth.users(id) on delete set null;

create index if not exists community_contributor_profiles_user_id_idx on public.community_contributor_profiles(user_id);
create index if not exists community_contributor_profiles_points_idx on public.community_contributor_profiles(total_points desc, approved_count desc);
create index if not exists community_product_recommendations_user_id_idx on public.community_product_recommendations(user_id);
create index if not exists community_product_recommendations_status_idx on public.community_product_recommendations(status);
create index if not exists community_product_recommendations_platform_idx on public.community_product_recommendations(platform_found_on);
create index if not exists community_product_recommendations_product_url_idx on public.community_product_recommendations(product_url);
create index if not exists community_product_recommendations_created_at_idx on public.community_product_recommendations(created_at desc);
create unique index if not exists community_product_recommendations_product_url_unique_idx
  on public.community_product_recommendations(product_url)
  where product_url is not null and length(trim(product_url)) > 0;
create index if not exists community_contribution_activity_logs_user_id_idx on public.community_contribution_activity_logs(user_id, created_at desc);
create index if not exists community_contribution_activity_logs_recommendation_id_idx on public.community_contribution_activity_logs(recommendation_id);
create index if not exists community_contribution_activity_logs_action_idx on public.community_contribution_activity_logs(action);

alter table public.community_contributor_profiles enable row level security;
alter table public.community_product_recommendations enable row level security;
alter table public.community_contribution_activity_logs enable row level security;

drop policy if exists "Public read contributor leaderboard" on public.community_contributor_profiles;
create policy "Public read contributor leaderboard"
on public.community_contributor_profiles
for select
using (true);

drop policy if exists "Users create own contributor profile" on public.community_contributor_profiles;
create policy "Users create own contributor profile"
on public.community_contributor_profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users update own contributor profile basics" on public.community_contributor_profiles;
create policy "Users update own contributor profile basics"
on public.community_contributor_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users read own or public approved recommendations" on public.community_product_recommendations;
create policy "Users read own or public approved recommendations"
on public.community_product_recommendations
for select
using (
  auth.uid() = user_id
  or status in ('approved', 'featured', 'sent_to_product_ops')
  or featured = true
);

drop policy if exists "Users submit own product recommendations" on public.community_product_recommendations;
create policy "Users submit own product recommendations"
on public.community_product_recommendations
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users edit own pending recommendations" on public.community_product_recommendations;
create policy "Users edit own pending recommendations"
on public.community_product_recommendations
for update
using (auth.uid() = user_id and status in ('pending_review', 'needs_info'))
with check (auth.uid() = user_id and status in ('pending_review', 'needs_info'));

drop policy if exists "Users read own contribution activity" on public.community_contribution_activity_logs;
create policy "Users read own contribution activity"
on public.community_contribution_activity_logs
for select
using (auth.uid() = user_id);
