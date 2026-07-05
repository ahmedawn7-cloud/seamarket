-- Migration for Scoring Bot (Bot 4)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: product_scores
CREATE TABLE IF NOT EXISTS public.product_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaned_product_id UUID REFERENCES public.cleaned_products(id) ON DELETE CASCADE,
  scraped_product_id UUID REFERENCES public.scraped_products(id) ON DELETE CASCADE,
  internal_product_id TEXT,
  opportunity_score NUMERIC,
  profit_score NUMERIC,
  demand_score NUMERIC,
  competition_score NUMERIC,
  supplier_score NUMERIC,
  risk_score NUMERIC,
  regulatory_score NUMERIC,
  launch_difficulty_score NUMERIC,
  trend_score NUMERIC,
  ai_score NUMERIC,
  confidence_score NUMERIC,
  final_recommendation TEXT,
  scoring_notes TEXT[],
  score_breakdown JSONB,
  scored_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cleaned_product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_scores_cleaned_product_id ON public.product_scores(cleaned_product_id);
CREATE INDEX IF NOT EXISTS idx_product_scores_scraped_product_id ON public.product_scores(scraped_product_id);
CREATE INDEX IF NOT EXISTS idx_product_scores_internal_product_id ON public.product_scores(internal_product_id);
CREATE INDEX IF NOT EXISTS idx_product_scores_opportunity_score ON public.product_scores(opportunity_score);
CREATE INDEX IF NOT EXISTS idx_product_scores_profit_score ON public.product_scores(profit_score);
CREATE INDEX IF NOT EXISTS idx_product_scores_demand_score ON public.product_scores(demand_score);
CREATE INDEX IF NOT EXISTS idx_product_scores_competition_score ON public.product_scores(competition_score);
CREATE INDEX IF NOT EXISTS idx_product_scores_risk_score ON public.product_scores(risk_score);
CREATE INDEX IF NOT EXISTS idx_product_scores_regulatory_score ON public.product_scores(regulatory_score);
CREATE INDEX IF NOT EXISTS idx_product_scores_ai_score ON public.product_scores(ai_score);
CREATE INDEX IF NOT EXISTS idx_product_scores_final_recommendation ON public.product_scores(final_recommendation);
CREATE INDEX IF NOT EXISTS idx_product_scores_scored_at ON public.product_scores(scored_at);

-- Trigger to automatically update 'updated_at' on product_scores
DROP TRIGGER IF EXISTS update_product_scores_modtime ON public.product_scores;
CREATE TRIGGER update_product_scores_modtime
BEFORE UPDATE ON public.product_scores
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

ALTER TABLE public.product_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users for product_scores" 
ON public.product_scores FOR SELECT TO authenticated USING (true);


-- Table: scorer_runs
CREATE TABLE IF NOT EXISTS public.scorer_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT,
  requested_limit INTEGER,
  products_found INTEGER,
  products_scored INTEGER,
  source_now_count INTEGER,
  watch_count INTEGER,
  research_more_count INTEGER,
  avoid_count INTEGER,
  products_failed INTEGER,
  error_message TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_scorer_runs_started_at ON public.scorer_runs(started_at);
CREATE INDEX IF NOT EXISTS idx_scorer_runs_status ON public.scorer_runs(status);

ALTER TABLE public.scorer_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users for scorer_runs" 
ON public.scorer_runs FOR SELECT TO authenticated USING (true);
