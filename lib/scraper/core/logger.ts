import { createClient } from "@supabase/supabase-js";
import { ScraperRunLog } from "../types/ProductScrapeRecord";

function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function createScraperLog(platform: string, limit: number): Promise<string | null> {
  try {
    const supabase = getServiceSupabase();
    const log: ScraperRunLog = {
      platform,
      status: "running",
      requested_limit: limit,
      products_found: 0,
      products_saved: 0,
      products_failed: 0,
    };

    const { data, error } = await supabase.from("scraper_runs").insert(log).select().single();
    if (error) {
      console.error("Failed to create scraper log:", error);
      return null;
    }
    return data.id;
  } catch (error) {
    console.error("Exception in createScraperLog:", error);
    return null;
  }
}

export async function updateScraperLog(id: string, updates: Partial<ScraperRunLog>) {
  try {
    if (!id) return;
    const supabase = getServiceSupabase();
    await supabase.from("scraper_runs").update(updates).eq("id", id);
  } catch (error) {
    console.error("Exception in updateScraperLog:", error);
  }
}
