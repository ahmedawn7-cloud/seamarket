-- Migration: add_scraper_platform_fields
-- Adds required nullable tracking and scoring fields to scraped_products

ALTER TABLE public.scraped_products 
ADD COLUMN IF NOT EXISTS platform_fee_pct NUMERIC,
ADD COLUMN IF NOT EXISTS source_keyword TEXT,
ADD COLUMN IF NOT EXISTS source_category TEXT,
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS raw_platform_data JSONB,
ADD COLUMN IF NOT EXISTS competition_score NUMERIC,
ADD COLUMN IF NOT EXISTS opportunity_score NUMERIC,
ADD COLUMN IF NOT EXISTS risk_score NUMERIC,
ADD COLUMN IF NOT EXISTS supplier_availability_score NUMERIC,
ADD COLUMN IF NOT EXISTS regulatory_risk_score NUMERIC,
ADD COLUMN IF NOT EXISTS trend_score NUMERIC;

-- Optional: Create index on opportunity_score for dashboard sorting
CREATE INDEX IF NOT EXISTS idx_scraped_products_opportunity_score ON public.scraped_products(opportunity_score);
