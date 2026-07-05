-- Migration for Scraper Bot Tables (scraped_products and scraper_runs)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: scraped_products
CREATE TABLE IF NOT EXISTS public.scraped_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scrape_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  platform TEXT NOT NULL,
  internal_rank INTEGER,
  rank INTEGER,
  trend_rank INTEGER,
  clean_name_ai TEXT,
  product_name TEXT NOT NULL,
  image_url TEXT,
  product_url TEXT NOT NULL,
  variant_count INTEGER,
  sales NUMERIC,
  price_rm NUMERIC,
  shipping_location TEXT,
  stock_level NUMERIC,
  rating_score NUMERIC,
  review_count INTEGER,
  video_url TEXT,
  discount_percent NUMERIC,
  store_name TEXT,
  category TEXT,
  brand TEXT,
  initial_price_low NUMERIC,
  final_price_low NUMERIC,
  affiliate_link TEXT,
  raw_payload JSONB,
  scrape_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for scraped_products
CREATE INDEX IF NOT EXISTS idx_scraped_products_platform ON public.scraped_products(platform);
CREATE INDEX IF NOT EXISTS idx_scraped_products_category ON public.scraped_products(category);
CREATE INDEX IF NOT EXISTS idx_scraped_products_scrape_date ON public.scraped_products(scrape_date);
CREATE INDEX IF NOT EXISTS idx_scraped_products_trend_rank ON public.scraped_products(trend_rank);
CREATE INDEX IF NOT EXISTS idx_scraped_products_internal_rank ON public.scraped_products(internal_rank);
CREATE INDEX IF NOT EXISTS idx_scraped_products_brand ON public.scraped_products(brand);
CREATE INDEX IF NOT EXISTS idx_scraped_products_store_name ON public.scraped_products(store_name);
CREATE INDEX IF NOT EXISTS idx_scraped_products_product_name ON public.scraped_products USING GIN(to_tsvector('english', product_name));
CREATE INDEX IF NOT EXISTS idx_scraped_products_clean_name_ai ON public.scraped_products USING GIN(to_tsvector('english', clean_name_ai));

-- Table: scraper_runs
CREATE TABLE IF NOT EXISTS public.scraper_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  platform TEXT NOT NULL,
  status TEXT NOT NULL,
  requested_limit INTEGER,
  products_found INTEGER DEFAULT 0,
  products_saved INTEGER DEFAULT 0,
  products_failed INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB
);

-- Trigger to automatically update 'updated_at' on scraped_products
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_scraped_products_modtime ON public.scraped_products;
CREATE TRIGGER update_scraped_products_modtime
BEFORE UPDATE ON public.scraped_products
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Row Level Security (RLS) - Enable RLS but restrict to service roles for modifications
ALTER TABLE public.scraped_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_runs ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Allow read access to authenticated users" 
ON public.scraped_products FOR SELECT 
TO authenticated 
USING (true);

-- Allow service role to do everything (handled automatically in Supabase, but explicit policy can be added if needed)
