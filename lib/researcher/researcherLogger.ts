import { getServiceSupabaseClient } from "@/lib/supabase/serviceRoleClient";

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
  const supabase = getServiceSupabaseClient();

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
  const supabase = getServiceSupabaseClient();

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
    if (error?.message?.includes('row-level security')) {
      console.warn("⚠️ Warning: RLS prevented logging run. Proceeding with mock run ID.");
      return "00000000-0000-0000-0000-000000000000";
    }
    throw new Error(`Failed to create researcher log: ${error?.message}`);
  }

  return data.id;
}
