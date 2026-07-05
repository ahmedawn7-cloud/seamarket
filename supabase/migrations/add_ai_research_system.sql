-- Create the product_ai_research table for the new AI workflow
CREATE TABLE IF NOT EXISTS public.product_ai_research (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_intake_id UUID REFERENCES public.product_intake(id) ON DELETE CASCADE,
    version INTEGER DEFAULT 1,
    
    -- Status and Metadata
    research_status TEXT DEFAULT 'pending', -- pending, running, completed, partial, failed, approved
    error_message TEXT,
    raw_ai_response JSONB,
    research_duration_seconds NUMERIC,
    model_used TEXT,
    confidence_score_total NUMERIC,
    scoring_weights JSONB,
    
    -- Step 1: Market Insights
    trend_analysis JSONB,      -- { original, edited, confidence }
    target_customer JSONB,
    problem_solved JSONB,
    usps JSONB,
    market_opportunity JSONB,
    
    -- Step 2: Competition & Supplier
    competition_landscape JSONB,
    supplier_availability JSONB,
    
    -- Step 3: Regulatory & Risk
    malaysia_regulatory JSONB,
    risk_analysis JSONB,
    
    -- Step 4: Financials & Actions
    recommended_price JSONB,
    estimated_margin JSONB,
    recommended_actions JSONB,
    
    -- Step 5: Scoring
    ai_score JSONB,            -- { score, explanation }
    opportunity_score JSONB,
    competition_score JSONB,
    supplier_score JSONB,
    risk_score_detail JSONB,
    margin_score JSONB,
    trend_momentum JSONB,
    commercial_readiness JSONB,
    
    -- Final Output
    final_intelligence_score NUMERIC,
    final_intelligence_explanation TEXT,
    
    -- Approval tracking
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure there's a unique constraint on product_intake_id per version if we want multiple versions later, 
-- but for now, one active row per intake is sufficient. We will use a unique index on intake id.
CREATE UNIQUE INDEX IF NOT EXISTS product_ai_research_intake_idx ON public.product_ai_research(product_intake_id);

-- Optional: Create an updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_research_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ai_research_updated_at ON public.product_ai_research;
CREATE TRIGGER trg_ai_research_updated_at
BEFORE UPDATE ON public.product_ai_research
FOR EACH ROW
EXECUTE FUNCTION update_ai_research_modtime();

-- Also notify postgrest to reload the schema automatically
NOTIFY pgrst, 'reload schema';
