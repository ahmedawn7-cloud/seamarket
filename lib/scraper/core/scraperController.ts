import { scraperConfig } from "../config/scraperConfig";
import { BaseAdapter } from "../adapters/baseAdapter";
import { ShopeeAdapter } from "../adapters/shopeeAdapter";
import { LazadaAdapter } from "../adapters/lazadaAdapter";
import { TikTokAdapter } from "../adapters/tiktokAdapter";
import { validateProduct } from "./validator";
import { saveProductsToSupabase } from "../database/saveProducts";
import { createScraperLog, updateScraperLog } from "./logger";

export class ScraperController {
  private getAdapter(platform: string): BaseAdapter {
    switch (platform.toLowerCase()) {
      case "shopee":
        return new ShopeeAdapter();
      case "lazada":
        return new LazadaAdapter();
      case "tiktok shop":
        return new TikTokAdapter();
      default:
        throw new Error(`Platform ${platform} is not supported.`);
    }
  }

  public async run(platform: string, limit: number = scraperConfig.defaultLimit) {
    console.log(`[ScraperController] Starting run for ${platform} with limit ${limit}`);
    
    // 1. Create Run Log
    const logId = await createScraperLog(platform, limit);

    try {
      // 2. Initialize Adapter
      const adapter = this.getAdapter(platform);

      // 3. Fetch and Normalize
      const rawNormalized = await adapter.getNormalizedProducts(limit);
      const foundCount = rawNormalized.length;

      // 4. Validate
      const validProducts = rawNormalized.filter(validateProduct);
      
      // 5. Deduplicate and Save to DB
      const { saved, failed } = await saveProductsToSupabase(validProducts);

      // 6. Update Log
      if (logId) {
        await updateScraperLog(logId, {
          status: "completed",
          finished_at: new Date(),
          products_found: foundCount,
          products_saved: saved,
          products_failed: failed + (foundCount - validProducts.length), // Include validation failures
        });
      }

      return {
        success: true,
        platform,
        found: foundCount,
        saved,
        failed: failed + (foundCount - validProducts.length),
      };

    } catch (error: any) {
      console.error(`[ScraperController] Run failed:`, error);
      if (logId) {
        await updateScraperLog(logId, {
          status: "failed",
          finished_at: new Date(),
          error_message: error.message || "Unknown error",
        });
      }
      return {
        success: false,
        error: error.message || "Unknown error",
      };
    }
  }
}
