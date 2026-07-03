import { createClient } from "@supabase/supabase-js";

export interface ResearcherRunSummary {
  status: "success" | "partial" | "failed";
  requested_limit: number;
  products_found: number;
  products_researched: number;
  supplier_records_created: number;
  regulatory_records_created: number;
  products_skipped: number;
  products_failed: number;
  error_message?: string;
  metadata?: any;
}

export async function logResearcherRun(runId: string, summary: ResearcherRunSummary) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error } = await supabase
    .from("researcher_runs")
    .update({
      finished_at: new Date().toISOString(),
      ...summary
    })
    .eq("id", runId);

  if (error) {
    console.error("Failed to update researcher log:", error);
  }
}

export async function createResearcherRunLog(limit: number): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from("researcher_runs")
    .insert([{ 
      status: "running", 
      requested_limit: limit,
      started_at: new Date().toISOString()
    }])
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create researcher log: ${error?.message}`);
  }

  return data.id;
}
