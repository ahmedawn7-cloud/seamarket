-- Profit Pilot AI schema repair for Bots 1-5 and user-facing save/community support.
-- Safe to run multiple times. It does not delete data and does not rename legacy tables.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS public.pp_product_id_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_pp_product_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'PP-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('public.pp_product_id_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Bot 1: scraper staging + run logging.
CREATE TABLE IF NOT EXISTS public.scraper_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_name TEXT,
  platform TEXT NOT NULL DEFAULT 'Internal',
  status TEXT NOT NULL DEFAULT 'queued',
  requested_limit INTEGER,
  items_requested INTEGER,
  products_found INTEGER DEFAULT 0,
  products_saved INTEGER DEFAULT 0,
  products_failed INTEGER DEFAULT 0,
  target_table TEXT,
  source_table TEXT,
  date_from DATE,
  date_to DATE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.scraper_runs
  ADD COLUMN IF NOT EXISTS bot_name TEXT,
  ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'Internal',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'queued',
  ADD COLUMN IF NOT EXISTS requested_limit INTEGER,
  ADD COLUMN IF NOT EXISTS items_requested INTEGER,
  ADD COLUMN IF NOT EXISTS products_found INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS products_saved INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS products_failed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_table TEXT,
  ADD COLUMN IF NOT EXISTS source_table TEXT,
  ADD COLUMN IF NOT EXISTS date_from DATE,
  ADD COLUMN IF NOT EXISTS date_to DATE,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.scraped_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scrape_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  platform TEXT NOT NULL DEFAULT 'Internal',
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
  stock_level TEXT,
  rating_score NUMERIC,
  review_count INTEGER,
  video_url TEXT,
  discount_percent NUMERIC,
  store_name TEXT,
  category TEXT,
  brand TEXT,
  initial_price_low NUMERIC,
  final_price_low NUMERIC,
  supplier_link TEXT,
  cogs_rm NUMERIC,
  weight_kg NUMERIC,
  dimensions_cm TEXT,
  platform_fee_pct NUMERIC,
  shipping_location_1 TEXT,
  ad_spend_est_rm NUMERIC,
  affiliate_link TEXT,
  revenue_calc NUMERIC,
  net_margin_calc NUMERIC,
  roi_calc NUMERIC,
  profit_score NUMERIC,
  source_keyword TEXT,
  source_category TEXT,
  source_url TEXT,
  raw_platform_data JSONB,
  competition_score NUMERIC,
  opportunity_score NUMERIC,
  risk_score NUMERIC,
  supplier_availability_score NUMERIC,
  regulatory_risk_score NUMERIC,
  trend_score NUMERIC,
  raw_payload JSONB,
  scrape_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.scraped_products
  ADD COLUMN IF NOT EXISTS supplier_link TEXT,
  ADD COLUMN IF NOT EXISTS cogs_rm NUMERIC,
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC,
  ADD COLUMN IF NOT EXISTS dimensions_cm TEXT,
  ADD COLUMN IF NOT EXISTS platform_fee_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS shipping_location_1 TEXT,
  ADD COLUMN IF NOT EXISTS ad_spend_est_rm NUMERIC,
  ADD COLUMN IF NOT EXISTS revenue_calc NUMERIC,
  ADD COLUMN IF NOT EXISTS net_margin_calc NUMERIC,
  ADD COLUMN IF NOT EXISTS roi_calc NUMERIC,
  ADD COLUMN IF NOT EXISTS profit_score NUMERIC,
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

CREATE TABLE IF NOT EXISTS public.scraped_products_staging (LIKE public.scraped_products INCLUDING DEFAULTS);
ALTER TABLE public.scraped_products_staging
  ADD COLUMN IF NOT EXISTS staging_status TEXT DEFAULT 'staged',
  ADD COLUMN IF NOT EXISTS source_run_id UUID,
  ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS quality_notes JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.scraper_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  frequency TEXT NOT NULL,
  day_of_week TEXT,
  date_time TIMESTAMPTZ,
  max_products INTEGER DEFAULT 100,
  enabled BOOLEAN DEFAULT true,
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bot 2: cleaner.
CREATE TABLE IF NOT EXISTS public.cleaned_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scraped_product_id UUID,
  internal_product_id TEXT DEFAULT public.generate_pp_product_id(),
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
  demand_score NUMERIC,
  competition_score NUMERIC,
  trend_score NUMERIC,
  opportunity_score NUMERIC,
  risk_score NUMERIC,
  margin_signal TEXT,
  supplier_readiness_score NUMERIC,
  product_verdict TEXT,
  ai_reasoning_summary TEXT,
  next_best_action TEXT,
  cleaner_version TEXT DEFAULT '2.0',
  cleaned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.cleaner_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_name TEXT DEFAULT 'Bot Cleaner',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT,
  requested_limit INTEGER,
  products_found INTEGER DEFAULT 0,
  products_cleaned INTEGER DEFAULT 0,
  products_duplicate INTEGER DEFAULT 0,
  products_invalid INTEGER DEFAULT 0,
  products_failed INTEGER DEFAULT 0,
  source_table TEXT,
  target_table TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Bot 3: researcher.
CREATE TABLE IF NOT EXISTS public.product_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaned_product_id UUID,
  internal_product_id TEXT,
  research_status TEXT DEFAULT 'pending',
  research_confidence TEXT,
  product_summary TEXT,
  business_summary TEXT,
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_research
  ADD COLUMN IF NOT EXISTS business_summary TEXT;

CREATE TABLE IF NOT EXISTS public.supplier_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaned_product_id UUID,
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

CREATE TABLE IF NOT EXISTS public.regulatory_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaned_product_id UUID,
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

CREATE TABLE IF NOT EXISTS public.researcher_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_name TEXT DEFAULT 'Research Bot',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT,
  requested_limit INTEGER,
  products_found INTEGER DEFAULT 0,
  products_researched INTEGER DEFAULT 0,
  supplier_records_created INTEGER DEFAULT 0,
  regulatory_records_created INTEGER DEFAULT 0,
  products_skipped INTEGER DEFAULT 0,
  products_failed INTEGER DEFAULT 0,
  source_table TEXT,
  target_table TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Bot 4: scorer.
CREATE TABLE IF NOT EXISTS public.product_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaned_product_id UUID,
  scraped_product_id UUID,
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scorer_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_name TEXT DEFAULT 'Scoring Bot',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT,
  requested_limit INTEGER,
  products_found INTEGER DEFAULT 0,
  products_scored INTEGER DEFAULT 0,
  source_now_count INTEGER DEFAULT 0,
  watch_count INTEGER DEFAULT 0,
  research_more_count INTEGER DEFAULT 0,
  avoid_count INTEGER DEFAULT 0,
  products_failed INTEGER DEFAULT 0,
  source_table TEXT,
  target_table TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Bot 5: Pasar AI chat memory.
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID,
  user_id UUID,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  intent TEXT,
  sources TEXT[],
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS user_id UUID;

-- User save/profile/research/community support.
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  business_type TEXT,
  country TEXT DEFAULT 'Malaysia',
  reward_points INTEGER DEFAULT 0,
  plan TEXT DEFAULT 'guest',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  product_id TEXT NOT NULL,
  snapshot JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.research_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT DEFAULT 'Untitled note',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.research_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT DEFAULT 'research',
  label TEXT DEFAULT 'Research task',
  prompt TEXT NOT NULL,
  status TEXT DEFAULT 'Queued',
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID,
  user_id UUID,
  title TEXT NOT NULL,
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  user_id UUID,
  body TEXT NOT NULL,
  parent_comment_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reaction TEXT DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction)
);

CREATE TABLE IF NOT EXISTS public.user_saved_community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.community_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS public.community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ,
  event_type TEXT DEFAULT 'online',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe unique constraints used by upserts.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cleaned_products_scraped_product_id_key') THEN
    ALTER TABLE public.cleaned_products ADD CONSTRAINT cleaned_products_scraped_product_id_key UNIQUE (scraped_product_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_research_cleaned_product_id_key') THEN
    ALTER TABLE public.product_research ADD CONSTRAINT product_research_cleaned_product_id_key UNIQUE (cleaned_product_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_scores_cleaned_product_id_key') THEN
    ALTER TABLE public.product_scores ADD CONSTRAINT product_scores_cleaned_product_id_key UNIQUE (cleaned_product_id);
  END IF;
EXCEPTION
  WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

-- Safe foreign keys. Each block is isolated so existing partial schemas do not stop the whole repair.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cleaned_products_scraped_product_id_fkey') THEN
    ALTER TABLE public.cleaned_products ADD CONSTRAINT cleaned_products_scraped_product_id_fkey FOREIGN KEY (scraped_product_id) REFERENCES public.scraped_products(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_research_cleaned_product_id_fkey') THEN
    ALTER TABLE public.product_research ADD CONSTRAINT product_research_cleaned_product_id_fkey FOREIGN KEY (cleaned_product_id) REFERENCES public.cleaned_products(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'supplier_research_cleaned_product_id_fkey') THEN
    ALTER TABLE public.supplier_research ADD CONSTRAINT supplier_research_cleaned_product_id_fkey FOREIGN KEY (cleaned_product_id) REFERENCES public.cleaned_products(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'regulatory_research_cleaned_product_id_fkey') THEN
    ALTER TABLE public.regulatory_research ADD CONSTRAINT regulatory_research_cleaned_product_id_fkey FOREIGN KEY (cleaned_product_id) REFERENCES public.cleaned_products(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_scores_cleaned_product_id_fkey') THEN
    ALTER TABLE public.product_scores ADD CONSTRAINT product_scores_cleaned_product_id_fkey FOREIGN KEY (cleaned_product_id) REFERENCES public.cleaned_products(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_scores_scraped_product_id_fkey') THEN
    ALTER TABLE public.product_scores ADD CONSTRAINT product_scores_scraped_product_id_fkey FOREIGN KEY (scraped_product_id) REFERENCES public.scraped_products(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_conversation_id_fkey') THEN
    ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'community_comments_post_id_fkey') THEN
    ALTER TABLE public.community_comments ADD CONSTRAINT community_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'community_post_reactions_post_id_fkey') THEN
    ALTER TABLE public.community_post_reactions ADD CONSTRAINT community_post_reactions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_saved_community_posts_post_id_fkey') THEN
    ALTER TABLE public.user_saved_community_posts ADD CONSTRAINT user_saved_community_posts_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Triggers.
DROP TRIGGER IF EXISTS update_scraped_products_modtime ON public.scraped_products;
CREATE TRIGGER update_scraped_products_modtime BEFORE UPDATE ON public.scraped_products FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_scraper_schedules_modtime ON public.scraper_schedules;
CREATE TRIGGER update_scraper_schedules_modtime BEFORE UPDATE ON public.scraper_schedules FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_cleaned_products_modtime ON public.cleaned_products;
CREATE TRIGGER update_cleaned_products_modtime BEFORE UPDATE ON public.cleaned_products FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_product_research_modtime ON public.product_research;
CREATE TRIGGER update_product_research_modtime BEFORE UPDATE ON public.product_research FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_supplier_research_modtime ON public.supplier_research;
CREATE TRIGGER update_supplier_research_modtime BEFORE UPDATE ON public.supplier_research FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_regulatory_research_modtime ON public.regulatory_research;
CREATE TRIGGER update_regulatory_research_modtime BEFORE UPDATE ON public.regulatory_research FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_product_scores_modtime ON public.product_scores;
CREATE TRIGGER update_product_scores_modtime BEFORE UPDATE ON public.product_scores FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_chat_conversations_modtime ON public.chat_conversations;
CREATE TRIGGER update_chat_conversations_modtime BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_user_profiles_modtime ON public.user_profiles;
CREATE TRIGGER update_user_profiles_modtime BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_research_notes_modtime ON public.research_notes;
CREATE TRIGGER update_research_notes_modtime BEFORE UPDATE ON public.research_notes FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_research_tasks_modtime ON public.research_tasks;
CREATE TRIGGER update_research_tasks_modtime BEFORE UPDATE ON public.research_tasks FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_community_posts_modtime ON public.community_posts;
CREATE TRIGGER update_community_posts_modtime BEFORE UPDATE ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_community_comments_modtime ON public.community_comments;
CREATE TRIGGER update_community_comments_modtime BEFORE UPDATE ON public.community_comments FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- Indexes.
CREATE INDEX IF NOT EXISTS idx_scraper_runs_bot_name ON public.scraper_runs(bot_name);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_status ON public.scraper_runs(status);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_started_at ON public.scraper_runs(started_at);
CREATE INDEX IF NOT EXISTS idx_scraped_products_platform ON public.scraped_products(platform);
CREATE INDEX IF NOT EXISTS idx_scraped_products_category ON public.scraped_products(category);
CREATE INDEX IF NOT EXISTS idx_scraped_products_scrape_date ON public.scraped_products(scrape_date);
CREATE INDEX IF NOT EXISTS idx_scraped_products_product_url ON public.scraped_products(product_url);
CREATE INDEX IF NOT EXISTS idx_scraped_products_staging_status ON public.scraped_products_staging(staging_status);
CREATE INDEX IF NOT EXISTS idx_scraped_products_staging_scrape_date ON public.scraped_products_staging(scrape_date);
CREATE INDEX IF NOT EXISTS idx_scraper_schedules_next_run ON public.scraper_schedules(enabled, next_run_at);
CREATE INDEX IF NOT EXISTS idx_cleaned_products_scraped_product_id ON public.cleaned_products(scraped_product_id);
CREATE INDEX IF NOT EXISTS idx_cleaned_products_internal_product_id ON public.cleaned_products(internal_product_id);
CREATE INDEX IF NOT EXISTS idx_cleaned_products_normalized_category ON public.cleaned_products(normalized_category);
CREATE INDEX IF NOT EXISTS idx_product_research_cleaned_product_id ON public.product_research(cleaned_product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_research_cleaned_product_id ON public.supplier_research(cleaned_product_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_research_cleaned_product_id ON public.regulatory_research(cleaned_product_id);
CREATE INDEX IF NOT EXISTS idx_researcher_runs_status ON public.researcher_runs(status);
CREATE INDEX IF NOT EXISTS idx_product_scores_cleaned_product_id ON public.product_scores(cleaned_product_id);
CREATE INDEX IF NOT EXISTS idx_product_scores_ai_score ON public.product_scores(ai_score);
CREATE INDEX IF NOT EXISTS idx_scorer_runs_status ON public.scorer_runs(status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan ON public.user_profiles(plan);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_user_id ON public.user_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_research_notes_user_id ON public.research_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_research_tasks_user_id ON public.research_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_reactions_post_id ON public.community_post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_community_posts_user_id ON public.user_saved_community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_follows_follower_id ON public.community_follows(follower_id);

-- RLS.
ALTER TABLE public.scraper_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_products_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaned_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaner_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.researcher_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scorer_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

-- Public/authenticated reads for product intelligence surfaces. Service role bypasses RLS for bot writes.
DROP POLICY IF EXISTS "Public read scraped products" ON public.scraped_products;
CREATE POLICY "Public read scraped products" ON public.scraped_products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated read bot intelligence" ON public.cleaned_products;
CREATE POLICY "Authenticated read bot intelligence" ON public.cleaned_products FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated read product research" ON public.product_research;
CREATE POLICY "Authenticated read product research" ON public.product_research FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated read supplier research" ON public.supplier_research;
CREATE POLICY "Authenticated read supplier research" ON public.supplier_research FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated read regulatory research" ON public.regulatory_research;
CREATE POLICY "Authenticated read regulatory research" ON public.regulatory_research FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated read product scores" ON public.product_scores;
CREATE POLICY "Authenticated read product scores" ON public.product_scores FOR SELECT TO authenticated USING (true);

-- User-owned app data.
DROP POLICY IF EXISTS "Users view own profile" ON public.user_profiles;
CREATE POLICY "Users view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users insert own profile" ON public.user_profiles;
CREATE POLICY "Users insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users update own profile" ON public.user_profiles;
CREATE POLICY "Users update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users manage own watchlist" ON public.user_watchlist;
CREATE POLICY "Users manage own watchlist" ON public.user_watchlist FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own research notes" ON public.research_notes;
CREATE POLICY "Users manage own research notes" ON public.research_notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own research tasks" ON public.research_tasks;
CREATE POLICY "Users manage own research tasks" ON public.research_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Community is public to read and authenticated to write own content/actions.
DROP POLICY IF EXISTS "Public read topics" ON public.community_topics;
CREATE POLICY "Public read topics" ON public.community_topics FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read community posts" ON public.community_posts;
CREATE POLICY "Public read community posts" ON public.community_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users create own community posts" ON public.community_posts;
CREATE POLICY "Users create own community posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own community posts" ON public.community_posts;
CREATE POLICY "Users update own community posts" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users delete own community posts" ON public.community_posts;
CREATE POLICY "Users delete own community posts" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read community comments" ON public.community_comments;
CREATE POLICY "Public read community comments" ON public.community_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users create own community comments" ON public.community_comments;
CREATE POLICY "Users create own community comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users delete own community comments" ON public.community_comments;
CREATE POLICY "Users delete own community comments" ON public.community_comments FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own community reactions" ON public.community_post_reactions;
CREATE POLICY "Users manage own community reactions" ON public.community_post_reactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own saved community posts" ON public.user_saved_community_posts;
CREATE POLICY "Users manage own saved community posts" ON public.user_saved_community_posts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own follows" ON public.community_follows;
CREATE POLICY "Users manage own follows" ON public.community_follows FOR ALL USING (auth.uid() = follower_id) WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Public read community events" ON public.community_events;
CREATE POLICY "Public read community events" ON public.community_events FOR SELECT USING (true);

-- Chat history is user-owned once user_id is provided; service role can still write operational logs.
DROP POLICY IF EXISTS "Users view own chat conversations" ON public.chat_conversations;
CREATE POLICY "Users view own chat conversations" ON public.chat_conversations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users view own chat messages" ON public.chat_messages;
CREATE POLICY "Users view own chat messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
