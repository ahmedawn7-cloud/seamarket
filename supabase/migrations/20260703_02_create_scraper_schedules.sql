-- Migration for Scraper Bot Scheduling Layer

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: scraper_schedules
CREATE TABLE IF NOT EXISTS public.scraper_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL,
  frequency TEXT NOT NULL, -- 'weekly' or 'one_time'
  day_of_week TEXT, -- e.g., 'Monday'
  date_time TIMESTAMPTZ, -- for one_time schedules
  max_products INTEGER DEFAULT 100,
  enabled BOOLEAN DEFAULT true,
  notes TEXT,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_scraper_schedules_enabled ON public.scraper_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_scraper_schedules_platform ON public.scraper_schedules(platform);
CREATE INDEX IF NOT EXISTS idx_scraper_schedules_next_run_at ON public.scraper_schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_scraper_schedules_frequency ON public.scraper_schedules(frequency);

-- Trigger to automatically update 'updated_at' on scraper_schedules
DROP TRIGGER IF EXISTS update_scraper_schedules_modtime ON public.scraper_schedules;
CREATE TRIGGER update_scraper_schedules_modtime
BEFORE UPDATE ON public.scraper_schedules
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Row Level Security (RLS)
ALTER TABLE public.scraper_schedules ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users (Admin UI)
CREATE POLICY "Allow read access to authenticated users for schedules" 
ON public.scraper_schedules FOR SELECT 
TO authenticated 
USING (true);

-- Allow service role to do everything (handled automatically in Supabase)
