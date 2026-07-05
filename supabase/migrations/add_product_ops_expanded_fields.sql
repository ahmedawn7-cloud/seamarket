-- Migration: add_product_ops_expanded_fields.sql

-- Core Fields
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS variant_count INTEGER;
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS stock_level INTEGER;
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS shipping_location TEXT;
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS seller_name TEXT;
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS marketplace_country TEXT;
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS source_type TEXT;
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS research_status TEXT DEFAULT 'pending';
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';

-- Research Fields
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS trend_reason TEXT;
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS why_interesting TEXT;
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS target_customer TEXT;
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS problem_solved TEXT;
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS competitor_notes TEXT;
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS supplier_notes TEXT;
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS risk_notes TEXT;
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS regulatory_notes TEXT;

-- Scoring Fields
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS ai_score NUMERIC;
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS opportunity_score NUMERIC;
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS competition_score NUMERIC;
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS supplier_availability_score NUMERIC;
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS risk_score NUMERIC;
ALTER TABLE public.product_intake ADD COLUMN IF NOT EXISTS margin_estimate NUMERIC;
