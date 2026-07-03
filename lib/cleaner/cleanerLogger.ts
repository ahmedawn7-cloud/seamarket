import { createClient } from "@supabase/supabase-js";

export interface CleanerRunSummary {
  status: "success" | "partial" | "failed";
  requested_limit: number;
  products_found: number;
  products_cleaned: number;
  products_duplicate: number;
  products_invalid: number;
  products_failed: number;
  error_message?: string;
  metadata?: any;
}

export async function logCleanerRun(runId: string, summary: CleanerRunSummary) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error } = await supabase
    .from("cleaner_runs")
    .update({
      finished_at: new Date().toISOString(),
      ...summary
    })
    .eq("id", runId);

  if (error) {
    console.error("Failed to update cleaner log:", error);
  }
}

export async function createCleanerRunLog(limit: number): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from("cleaner_runs")
    .insert([{ 
      status: "running", 
      requested_limit: limit,
      started_at: new Date().toISOString()
    }])
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create cleaner log: ${error?.message}`);
  }

  return data.id;
}
