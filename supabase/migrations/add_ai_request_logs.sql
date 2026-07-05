-- Create the AI Request Logs table
CREATE TABLE IF NOT EXISTS public.ai_request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    bot_name TEXT NOT NULL,
    request_type TEXT NOT NULL,
    prompt_version TEXT,
    execution_time_ms NUMERIC,
    token_usage INTEGER,
    success BOOLEAN NOT NULL DEFAULT true,
    retry_count INTEGER DEFAULT 0,
    fallback_provider TEXT,
    error_message TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS but allow everything for authenticated/service roles (assuming internal usage)
ALTER TABLE public.ai_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role access" ON public.ai_request_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);
