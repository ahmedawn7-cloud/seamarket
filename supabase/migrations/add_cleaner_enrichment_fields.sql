-- Migration: add_cleaner_enrichment_fields
-- Adds required AI and tracking fields to cleaned_products safely

ALTER TABLE public.cleaned_products 
ADD COLUMN IF NOT EXISTS demand_score NUMERIC,
ADD COLUMN IF NOT EXISTS competition_score NUMERIC,
ADD COLUMN IF NOT EXISTS trend_score NUMERIC,
ADD COLUMN IF NOT EXISTS opportunity_score NUMERIC,
ADD COLUMN IF NOT EXISTS risk_score NUMERIC,
ADD COLUMN IF NOT EXISTS margin_signal TEXT,
ADD COLUMN IF NOT EXISTS supplier_readiness_score NUMERIC,
ADD COLUMN IF NOT EXISTS product_verdict TEXT,
ADD COLUMN IF NOT EXISTS ai_reasoning_summary TEXT,
ADD COLUMN IF NOT EXISTS next_best_action TEXT,
ADD COLUMN IF NOT EXISTS cleaner_version TEXT DEFAULT '2.0';

-- cleaner_runs should already exist from previous migrations, but we ensure it's there
CREATE TABLE IF NOT EXISTS public.cleaner_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT,
  requested_limit INTEGER,
  products_found INTEGER,
  products_cleaned INTEGER,
  products_duplicate INTEGER,
  products_invalid INTEGER,
  products_failed INTEGER,
  error_message TEXT,
  metadata JSONB
);

-- Indexing for dashboard performance
CREATE INDEX IF NOT EXISTS idx_cleaned_products_opportunity_score ON public.cleaned_products(opportunity_score);
CREATE INDEX IF NOT EXISTS idx_cleaned_products_product_verdict ON public.cleaned_products(product_verdict);
