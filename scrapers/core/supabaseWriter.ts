import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabaseClient } from "@/lib/supabase/serviceRoleClient";
import { NormalizedProduct } from "./normalizeProduct";
import { ScraperLogger } from "./logger";

export interface ScraperRunResult {
  platform: string;
  total_candidates_found: number;
  total_products_saved: number;
  errors: string[];
  started_at: Date;
  finished_at: Date | null;
  status: string;
}

export class SupabaseWriter {
  private supabase: SupabaseClient | null = null;
  private logger: ScraperLogger;
  private isDryRun: boolean;

  constructor(platform: string, isDryRun: boolean = false) {
    this.logger = new ScraperLogger(platform);
    this.isDryRun = isDryRun;

    try {
      this.supabase = getServiceSupabaseClient();
    } catch (error) {
      if (!this.isDryRun) {
        this.logger.warn(
          `${error instanceof Error ? error.message : "Supabase service role is not configured."} Running in DRY RUN mode.`,
        );
        this.isDryRun = true;
      }
    }
  }

  async saveProducts(products: NormalizedProduct[]): Promise<number> {
    if (this.isDryRun) {
      this.logger.success(`[DRY RUN] Would have saved ${products.length} products to Supabase.`);
      return products.length;
    }

    if (!this.supabase || products.length === 0) return 0;

    let saved = 0;

    try {
     

      const { error } = await this.supabase
        .from("scraped_products")
        .upsert(products, { onConflict: "platform,product_url" });

      if (error) {
        this.logger.error("Failed to insert products", error);
      } else {
        saved = products.length;
        this.logger.success(`Saved ${saved} products to Supabase.`);
      }
    } catch (e) {
      this.logger.error("Exception writing to Supabase", e);
    }

    return saved;
  }

  async saveRunRecord(record: ScraperRunResult): Promise<void> {
    if (this.isDryRun) {
      this.logger.info(`[DRY RUN] Would have saved run record: ${record.status}`);
      return;
    }

    if (!this.supabase) return;

    try {
      const { error } = await this.supabase
        .from("scraper_runs")
        .insert({
          platform: record.platform,
          status: record.status,
          total_candidates_found: record.total_candidates_found,
          total_products_saved: record.total_products_saved,
          errors: record.errors,
          started_at: record.started_at.toISOString(),
          finished_at: record.finished_at ? record.finished_at.toISOString() : null,
          metadata: { is_inhouse_scraper: true },
        });

      if (error) {
        this.logger.error("Failed to save run record", error);
      }
    } catch (e) {
      this.logger.error("Exception writing run record", e);
    }
  }
}