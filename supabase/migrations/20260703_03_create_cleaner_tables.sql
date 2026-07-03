-- Migration for Cleaner Bot (Bot 2)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sequence and function for internal_product_id generation
CREATE SEQUENCE IF NOT EXISTS pp_product_id_seq START 1;

CREATE OR REPLACE FUNCTION generate_pp_product_id() RETURNS TEXT AS $$
BEGIN
  RETURN 'PP-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('pp_product_id_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Table: cleaned_products
CREATE TABLE IF NOT EXISTS public.cleaned_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scraped_product_id UUID REFERENCES public.scraped_products(id) ON DELETE CASCADE,
  internal_product_id TEXT DEFAULT generate_pp_product_id(),
  platform TEXT,
  original_product_name TEXT,
  clean_name_ai TEXT,
  translated_name TEXT,
  normalized_brand TEXT,
  normalized_category TEXT,
  product_type TEXT,
  language TEXT,
  keywords TEXT[],
  duplicate_group TEXT,
  is_duplicate BOOLEAN DEFAULT false,
  image_hash TEXT,
  product_url TEXT,
  image_url TEXT,
  validation_status TEXT,
  validation_errors TEXT[],
  confidence_score NUMERIC,
  cleaned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scraped_product_id)
);

-- Indexes for cleaned_products
CREATE INDEX IF NOT EXISTS idx_cleaned_products_scraped_product_id ON public.cleaned_products(scraped_product_id);
CREATE INDEX IF NOT EXISTS idx_cleaned_products_internal_product_id ON public.cleaned_products(internal_product_id);
CREATE INDEX IF NOT EXISTS idx_cleaned_products_clean_name_ai ON public.cleaned_products(clean_name_ai);
CREATE INDEX IF NOT EXISTS idx_cleaned_products_normalized_brand ON public.cleaned_products(normalized_brand);
CREATE INDEX IF NOT EXISTS idx_cleaned_products_normalized_category ON public.cleaned_products(normalized_category);
CREATE INDEX IF NOT EXISTS idx_cleaned_products_language ON public.cleaned_products(language);
CREATE INDEX IF NOT EXISTS idx_cleaned_products_is_duplicate ON public.cleaned_products(is_duplicate);
CREATE INDEX IF NOT EXISTS idx_cleaned_products_duplicate_group ON public.cleaned_products(duplicate_group);
CREATE INDEX IF NOT EXISTS idx_cleaned_products_confidence_score ON public.cleaned_products(confidence_score);
CREATE INDEX IF NOT EXISTS idx_cleaned_products_validation_status ON public.cleaned_products(validation_status);
CREATE INDEX IF NOT EXISTS idx_cleaned_products_cleaned_at ON public.cleaned_products(cleaned_at);

-- Trigger to automatically update 'updated_at' on cleaned_products
DROP TRIGGER IF EXISTS update_cleaned_products_modtime ON public.cleaned_products;
CREATE TRIGGER update_cleaned_products_modtime
BEFORE UPDATE ON public.cleaned_products
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Row Level Security (RLS) for cleaned_products
ALTER TABLE public.cleaned_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users for cleaned_products" 
ON public.cleaned_products FOR SELECT 
TO authenticated 
USING (true);

-- Table: cleaner_runs
CREATE TABLE IF NOT EXISTS public.cleaner_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Indexes for cleaner_runs
CREATE INDEX IF NOT EXISTS idx_cleaner_runs_started_at ON public.cleaner_runs(started_at);
CREATE INDEX IF NOT EXISTS idx_cleaner_runs_status ON public.cleaner_runs(status);

-- Row Level Security (RLS) for cleaner_runs
ALTER TABLE public.cleaner_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users for cleaner_runs" 
ON public.cleaner_runs FOR SELECT 
TO authenticated 
USING (true);
