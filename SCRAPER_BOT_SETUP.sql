-- ProfitPilot AI scraper bot backend foundation
-- Run this in Supabase SQL Editor when you are ready to store scraper runs and bot outputs.

create extension if not exists pgcrypto;

create table if not exists public.scraper_runs (
  id uuid primary key default gen_random_uuid(),
  bot_name text not null,
  platform text,
  status text not null default 'queued',
  started_at timestamptz,
  finished_at timestamptz,
  items_requested integer default 0,
  items_collected integer default 0,
  error_message text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.scraper_run_logs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.scraper_runs(id) on delete cascade,
  level text not null default 'info',
  message text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.scraped_products_staging (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.scraper_runs(id) on delete set null,
  scrape_date date default current_date,
  platform text,
  product_name text,
  image_url text,
  product_url text,
  variant_count integer,
  sales integer,
  price_rm numeric,
  shipping_location text,
  stock_level text,
  rating_score numeric,
  review_count integer,
  video_url text,
  category text,
  brand text,
  initial_price_low numeric,
  platform_fee_pct numeric,
  trend_rank integer,
  raw_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.product_research_scores (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  product_snapshot jsonb default '{}'::jsonb,
  internal_rank integer,
  ad_spend_est_rm numeric,
  discount_percent numeric,
  final_price_low numeric,
  supplier_link text,
  weight_kg numeric,
  dimensions_cm text,
  affiliate_link text,
  cogs_rm numeric,
  roi_calc numeric,
  revenue_calc numeric,
  net_margin_calc numeric,
  profit_score numeric,
  research_notes text,
  created_at timestamptz default now()
);

alter table public.scraper_runs enable row level security;
alter table public.scraper_run_logs enable row level security;
alter table public.scraped_products_staging enable row level security;
alter table public.product_research_scores enable row level security;

drop policy if exists "Operators read scraper runs" on public.scraper_runs;
create policy "Operators read scraper runs"
on public.scraper_runs
for select
using (true);

drop policy if exists "Operators read scraper logs" on public.scraper_run_logs;
create policy "Operators read scraper logs"
on public.scraper_run_logs
for select
using (true);

drop policy if exists "Operators read scraped staging" on public.scraped_products_staging;
create policy "Operators read scraped staging"
on public.scraped_products_staging
for select
using (true);

drop policy if exists "Operators read research scores" on public.product_research_scores;
create policy "Operators read research scores"
on public.product_research_scores
for select
using (true);
