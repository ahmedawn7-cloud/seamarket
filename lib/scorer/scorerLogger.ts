import { createClient } from "@supabase/supabase-js";

export interface ScorerRunSummary {
  status: "success" | "partial" | "failed";
  requested_limit: number;
  products_found: number;
  products_scored: number;
  source_now_count: number;
  watch_count: number;
  research_more_count: number;
  avoid_count: number;
  products_failed: number;
  error_message?: string;
  metadata?: any;
}

export async function logScorerRun(runId: string, summary: ScorerRunSummary) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error } = await supabase
    .from("scorer_runs")
    .update({
      finished_at: new Date().toISOString(),
      ...summary
    })
    .eq("id", runId);

  if (error) {
    console.error("Failed to update scorer log:", error);
  }
}

export async function createScorerRunLog(limit: number): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from("scorer_runs")
    .insert([{ 
      status: "running", 
      requested_limit: limit,
      started_at: new Date().toISOString()
    }])
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create scorer log: ${error?.message}`);
  }

  return data.id;
}
