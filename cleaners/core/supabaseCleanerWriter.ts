import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabaseClient } from "@/lib/supabase/serviceRoleClient";
import { CleanProductCandidate } from "./deduplicator";

export class SupabaseCleanerWriter {
  private supabase: SupabaseClient | null = null;
  private isDryRun: boolean;

  constructor(isDryRun: boolean = false) {
    this.isDryRun = isDryRun;
    try {
      this.supabase = getServiceSupabaseClient();
    } catch (error) {
      if (!this.isDryRun) {
        console.warn(error instanceof Error ? error.message : "Supabase service role is not configured.");
        this.isDryRun = true;
      }
    }
  }

  async getUncleanedProducts(limit: number, recent: boolean, platform?: string): Promise<any[]> {
    if (!this.supabase) return [];

    let query = this.supabase
      .from("scraped_products")
      .select("*, cleaned_products(scraped_product_id)")
      .limit(limit);

    if (recent) {
      query = query.order("scrape_date", { ascending: false });
    }

    if (platform) {
      query = query.ilike("platform", `%${platform}%`);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error("[Cleaner] Error fetching products", error);
      return [];
    }

    // Filter out ones that already exist in cleaned_products
    // (PostgREST doesn't support NOT IN easily with left joins in the JS client without specific RPCs, so filtering in memory)
    return (data || []).filter((d: any) => !d.cleaned_products || d.cleaned_products.length === 0);
  }

  async saveCleanedProducts(products: CleanProductCandidate[]): Promise<number> {
    if (this.isDryRun) {
      console.log(`[DRY RUN] Would have saved ${products.length} cleaned products.`);
      return products.length;
    }

    if (!this.supabase || products.length === 0) return 0;

    // Remove foreign relation artifacts if any before saving
    const payload = products.map(p => {
      const clean = { ...p };
      delete clean.cleaned_products;
      return clean;
    });

    const { error } = await this.supabase
      .from("cleaned_products")
      .upsert(payload, { onConflict: "scraped_product_id" });

    if (error) {
      console.error("[Cleaner] Error saving cleaned products", error);
      return 0;
    }

    return products.length;
  }

  async saveRunRecord(status: string, found: number, cleaned: number, duplicates: number, errors: string[]): Promise<void> {
    if (this.isDryRun) {
      console.log(`[DRY RUN] Run recorded: ${status}`);
      return;
    }
    if (!this.supabase) return;

    try {
      await this.supabase.from("cleaner_runs").insert({
        status,
        products_found: found,
        products_cleaned: cleaned,
        products_duplicate: duplicates,
        error_message: errors.join(" | "),
        finished_at: new Date().toISOString()
      });
    } catch (e) {
      console.error("[Cleaner] Failed to write run record", e);
    }
  }
}
