-- Migration: add_product_ops_system.sql

-- Enable UUID extension if not already enabled (usually is, but good practice)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.product_research_weeks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_label TEXT NOT NULL UNIQUE,
    week_start_date DATE,
    week_end_date DATE,
    target_total INTEGER DEFAULT 100,
    target_shopee INTEGER DEFAULT 34,
    target_lazada INTEGER DEFAULT 33,
    target_tiktok INTEGER DEFAULT 33,
    submitted_count INTEGER DEFAULT 0,
    approved_count INTEGER DEFAULT 0,
    rejected_count INTEGER DEFAULT 0,
    needs_fix_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'in_progress',
    locked_at TIMESTAMPTZ,
    locked_by TEXT,
    lock_reason TEXT,
    bots_started_at TIMESTAMPTZ,
    bots_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_intake (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_id UUID REFERENCES public.product_research_weeks(id) ON DELETE SET NULL,
    week_label TEXT,
    product_name TEXT NOT NULL,
    platform TEXT NOT NULL,
    product_url TEXT,
    image_url TEXT,
    category TEXT,
    price_rm NUMERIC,
    approximate_sales NUMERIC,
    rating_score NUMERIC,
    review_count INTEGER,
    source_keyword TEXT,
    notes TEXT,
    agent_name TEXT,
    agent_email TEXT,
    status TEXT DEFAULT 'submitted',
    duplicate_warning BOOLEAN DEFAULT FALSE,
    duplicate_of UUID,
    missing_fields JSONB DEFAULT '[]'::jsonb,
    locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_intake_week_label ON public.product_intake(week_label);
CREATE INDEX IF NOT EXISTS idx_product_intake_platform ON public.product_intake(platform);
CREATE INDEX IF NOT EXISTS idx_product_intake_status ON public.product_intake(status);
CREATE INDEX IF NOT EXISTS idx_product_intake_product_url ON public.product_intake(product_url);
CREATE INDEX IF NOT EXISTS idx_product_intake_product_name ON public.product_intake(product_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_week_product_url ON public.product_intake(week_label, product_url) WHERE product_url IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.product_bot_research (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_intake_id UUID REFERENCES public.product_intake(id) ON DELETE CASCADE,
    week_label TEXT,
    market_research JSONB,
    supplier_research JSONB,
    shipping_research JSONB,
    platform_policy_research JSONB,
    ranking_result JSONB,
    performance_tracking JSONB,
    final_opportunity_score NUMERIC DEFAULT 0,
    final_risk_score NUMERIC DEFAULT 0,
    final_recommendation TEXT,
    recommended_platform TEXT,
    recommended_category TEXT,
    research_status TEXT DEFAULT 'pending',
    research_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_intake_id)
);

CREATE TABLE IF NOT EXISTS public.product_ops_bot_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_label TEXT,
    product_intake_id UUID REFERENCES public.product_intake(id) ON DELETE CASCADE,
    bot_name TEXT,
    status TEXT DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    duration_seconds NUMERIC,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agent_productivity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_label TEXT,
    agent_name TEXT,
    agent_email TEXT,
    action TEXT,
    product_intake_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
