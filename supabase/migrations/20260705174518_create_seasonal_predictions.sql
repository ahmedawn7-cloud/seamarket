CREATE TABLE IF NOT EXISTS public.seasonal_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  event_id TEXT NOT NULL,
  category TEXT NOT NULL,
  model_used TEXT NOT NULL,
  prediction_json JSONB NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(year, event_id, category)
);

-- Enable RLS
ALTER TABLE public.seasonal_predictions ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for guest preview and logged in users)
CREATE POLICY "Public read seasonal predictions"
ON public.seasonal_predictions
FOR SELECT
USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_seasonal_predictions_modtime()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seasonal_predictions_modtime
BEFORE UPDATE ON public.seasonal_predictions
FOR EACH ROW
EXECUTE FUNCTION public.update_seasonal_predictions_modtime();

-- Add indexes for fast lookup
CREATE INDEX idx_seasonal_predictions_lookup ON public.seasonal_predictions(year, event_id, category);
CREATE INDEX idx_seasonal_predictions_valid ON public.seasonal_predictions(valid_until);
