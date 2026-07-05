-- Migration for Research Bot (Bot 3)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: product_research
CREATE TABLE IF NOT EXISTS public.product_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaned_product_id UUID REFERENCES public.cleaned_products(id) ON DELETE CASCADE,
  internal_product_id TEXT,
  research_status TEXT DEFAULT 'pending',
  research_confidence TEXT,
  product_summary TEXT,
  target_customer TEXT,
  demand_signals TEXT[],
  competition_signals TEXT[],
  product_risks TEXT[],
  shipping_risks TEXT[],
  launch_difficulty TEXT,
  marketing_angles TEXT[],
  suggested_keywords TEXT[],
  suggested_titles JSONB,
  suggested_listing_bullets TEXT[],
  regulatory_notes TEXT[],
  research_sources JSONB,
  researched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cleaned_product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_research_cleaned_product_id ON public.product_research(cleaned_product_id);
CREATE INDEX IF NOT EXISTS idx_product_research_internal_product_id ON public.product_research(internal_product_id);
CREATE INDEX IF NOT EXISTS idx_product_research_research_status ON public.product_research(research_status);
CREATE INDEX IF NOT EXISTS idx_product_research_research_confidence ON public.product_research(research_confidence);
CREATE INDEX IF NOT EXISTS idx_product_research_launch_difficulty ON public.product_research(launch_difficulty);
CREATE INDEX IF NOT EXISTS idx_product_research_researched_at ON public.product_research(researched_at);

-- Trigger to automatically update 'updated_at' on product_research
DROP TRIGGER IF EXISTS update_product_research_modtime ON public.product_research;
CREATE TRIGGER update_product_research_modtime
BEFORE UPDATE ON public.product_research
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

ALTER TABLE public.product_research ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users for product_research" 
ON public.product_research FOR SELECT TO authenticated USING (true);


-- Table: supplier_research
CREATE TABLE IF NOT EXISTS public.supplier_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaned_product_id UUID REFERENCES public.cleaned_products(id) ON DELETE CASCADE,
  internal_product_id TEXT,
  supplier_type TEXT,
  supplier_name TEXT,
  supplier_url TEXT,
  supplier_country TEXT,
  supplier_shipping_location TEXT,
  estimated_cogs_rm NUMERIC,
  estimated_moq INTEGER,
  estimated_lead_time_days INTEGER,
  supplier_confidence TEXT,
  supplier_notes TEXT,
  source TEXT,
  raw_payload JSONB,
  researched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_research_cleaned_product_id ON public.supplier_research(cleaned_product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_research_internal_product_id ON public.supplier_research(internal_product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_research_supplier_type ON public.supplier_research(supplier_type);
CREATE INDEX IF NOT EXISTS idx_supplier_research_supplier_country ON public.supplier_research(supplier_country);
CREATE INDEX IF NOT EXISTS idx_supplier_research_supplier_confidence ON public.supplier_research(supplier_confidence);

DROP TRIGGER IF EXISTS update_supplier_research_modtime ON public.supplier_research;
CREATE TRIGGER update_supplier_research_modtime
BEFORE UPDATE ON public.supplier_research
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

ALTER TABLE public.supplier_research ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users for supplier_research" 
ON public.supplier_research FOR SELECT TO authenticated USING (true);


-- Table: regulatory_research
CREATE TABLE IF NOT EXISTS public.regulatory_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaned_product_id UUID REFERENCES public.cleaned_products(id) ON DELETE CASCADE,
  internal_product_id TEXT,
  country TEXT DEFAULT 'Malaysia',
  category TEXT,
  possible_regulatory_flags TEXT[],
  sirim_risk TEXT,
  kkm_risk TEXT,
  npra_risk TEXT,
  customs_risk TEXT,
  age_restriction_risk TEXT,
  restricted_product_risk TEXT,
  compliance_notes TEXT[],
  official_sources JSONB,
  regulatory_confidence TEXT,
  researched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regulatory_research_cleaned_product_id ON public.regulatory_research(cleaned_product_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_research_internal_product_id ON public.regulatory_research(internal_product_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_research_category ON public.regulatory_research(category);
CREATE INDEX IF NOT EXISTS idx_regulatory_research_sirim_risk ON public.regulatory_research(sirim_risk);
CREATE INDEX IF NOT EXISTS idx_regulatory_research_kkm_risk ON public.regulatory_research(kkm_risk);
CREATE INDEX IF NOT EXISTS idx_regulatory_research_npra_risk ON public.regulatory_research(npra_risk);
CREATE INDEX IF NOT EXISTS idx_regulatory_research_regulatory_confidence ON public.regulatory_research(regulatory_confidence);

DROP TRIGGER IF EXISTS update_regulatory_research_modtime ON public.regulatory_research;
CREATE TRIGGER update_regulatory_research_modtime
BEFORE UPDATE ON public.regulatory_research
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

ALTER TABLE public.regulatory_research ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users for regulatory_research" 
ON public.regulatory_research FOR SELECT TO authenticated USING (true);


-- Table: researcher_runs
CREATE TABLE IF NOT EXISTS public.researcher_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT,
  requested_limit INTEGER,
  products_found INTEGER,
  products_researched INTEGER,
  supplier_records_created INTEGER,
  regulatory_records_created INTEGER,
  products_skipped INTEGER,
  products_failed INTEGER,
  error_message TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_researcher_runs_started_at ON public.researcher_runs(started_at);
CREATE INDEX IF NOT EXISTS idx_researcher_runs_status ON public.researcher_runs(status);

ALTER TABLE public.researcher_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users for researcher_runs" 
ON public.researcher_runs FOR SELECT TO authenticated USING (true);
