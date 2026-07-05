import axios from "axios";
import * as fs from "fs";
import { TIKTOK_CONFIG } from "./tiktokConfig";
import { RawProduct, NormalizedProduct, normalizeProduct } from "../../core/normalizeProduct";
import { scoreProduct, deduplicateProducts } from "../../core/productScorer";
import { ScraperLogger } from "../../core/logger";

export class TiktokScraper {
  private logger = new ScraperLogger("TikTok Shop");

  private extractItems(payload: any): any[] {
    if (Array.isArray(payload)) return payload;

    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.products)) return payload.products;

    if (Array.isArray(payload?.data?.items)) return payload.data.items;
    if (Array.isArray(payload?.data?.products)) return payload.data.products;
    if (Array.isArray(payload?.result?.items)) return payload.result.items;
    if (Array.isArray(payload?.result?.products)) return payload.result.products;

    return [];
  }

  private cleanNumber(value: any): number | null {
    if (typeof value === "number") return value;
    if (!value) return null;

    const text = value.toString().toLowerCase().replace(/,/g, "");
    const num = parseFloat(text.replace(/[^0-9.]/g, ""));

    if (Number.isNaN(num)) return null;
    if (text.includes("k")) return Math.round(num * 1000);
    if (text.includes("m")) return Math.round(num * 1000000);

    return num;
  }

  async run(keywordInput?: string): Promise<NormalizedProduct[]> {
    this.logger.info("Starting TikTok Shop scraper via Bright Data API...");
    const candidates: RawProduct[] = [];

    const token = process.env.BRIGHT_DATA_API_TOKEN;
    if (!token) {
      this.logger.error("BRIGHT_DATA_API_TOKEN is missing from environment variables.");
      return [];
    }

    const keywordsToScrape = keywordInput ? [keywordInput] : TIKTOK_CONFIG.keywords;
    const isMock = process.env.MOCK_SCRAPER === "true";
    const debugFilePath = "tiktok_debug_data.json";

    try {
      for (const keyword of keywordsToScrape) {
        if (candidates.length >= TIKTOK_CONFIG.maxCandidatesPerPlatform) break;

        this.logger.info(`Fetching: ${keyword} via Bright Data`);

        try {
          let rawPayload: any = null;

          if (isMock && fs.existsSync(debugFilePath)) {
            this.logger.info(`[MOCK MODE] Reading from ${debugFilePath}`);
            const fileData = fs.readFileSync(debugFilePath, "utf-8");
            rawPayload = JSON.parse(fileData);
          } else {
            const response = await axios({
              url: "https://api.brightdata.com/datasets/v3/scrape",
              method: "POST",
              params: {
                dataset_id: "gd_m45m1u911dsa4274pi",
                format: "json",
              },
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              data: [
                {
                  url: `https://shop.tiktok.com/search?q=${encodeURIComponent(keyword)}`,
                },
              ],
              timeout: 120000,
            });

            rawPayload = response.data;

            fs.writeFileSync(debugFilePath, JSON.stringify(rawPayload, null, 2));
            this.logger.info(`Saved raw API response to ${debugFilePath}`);
          }

          const items = this.extractItems(rawPayload);
          this.logger.info(`Extracted ${items.length} raw cards for ${keyword}`);

          for (const data of items) {
            const safeData = { ...data };

            delete safeData.seller;
            delete safeData.seller_name;
            delete safeData.shop_name;
            delete safeData.shop;
            delete safeData.seller_url;
            delete safeData.shop_url;

            const title =
              safeData.title ||
              safeData.product_name ||
              safeData.name ||
              safeData.product_title ||
              `TikTok Product (${keyword})`;

            const image =
              safeData.image ||
              safeData.image_url ||
              safeData.thumbnail ||
              safeData.cover ||
              safeData.main_image ||
              "https://dummyimage.com/600x400/ccc/000&text=No+Image";

            const productUrl =
              safeData.url ||
              safeData.product_url ||
              safeData.link ||
              safeData.product_link ||
              `mock://tiktok/${encodeURIComponent(keyword)}-${encodeURIComponent(title)}`;

            const price =
              this.cleanNumber(safeData.price) ||
              this.cleanNumber(safeData.price_rm) ||
              this.cleanNumber(safeData.sale_price) ||
              this.cleanNumber(safeData.current_price);

            const sales =
              this.cleanNumber(safeData.sales) ||
              this.cleanNumber(safeData.sold) ||
              this.cleanNumber(safeData.sold_count) ||
              this.cleanNumber(safeData.units_sold);

            candidates.push({
              platform: "TikTok Shop",
              product_name: title,
              image_url: image,
              product_url: productUrl,
              price_rm: price,
              sales,
              rating_score: this.cleanNumber(safeData.rating || safeData.rating_score),
              review_count: this.cleanNumber(safeData.review_count || safeData.reviews),
              category: safeData.category || "TikTok Shop Trend",
              source_keyword: keyword,
              source_category: safeData.category || "TikTok Shop Trend",
              source_url: `https://shop.tiktok.com/search?q=${encodeURIComponent(keyword)}`,
              raw_platform_data: safeData,
            });
          }
        } catch (apiError: any) {
          const errorDetails = apiError.response?.data
            ? JSON.stringify(apiError.response.data)
            : apiError.message;

          this.logger.error(`Bright Data API error for ${keyword}: ${errorDetails}`);
          continue;
        }
      }
    } catch (e) {
      this.logger.error("Error during TikTok scraping execution", e);
    }

    this.logger.success(`Collected ${candidates.length} raw candidates from TikTok Shop.`);

    let normalized = candidates.map(normalizeProduct);

    normalized = normalized.map((p) => ({
      ...p,
      competition_score: p.competition_score ?? 0,
      opportunity_score: p.opportunity_score ?? 0,
      regulatory_risk_score: p.regulatory_risk_score ?? 0,
      platform_fee_pct: p.platform_fee_pct ?? 0,
    }));

    normalized = normalized.map(scoreProduct);
    normalized = deduplicateProducts(normalized);

    normalized.sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));

    const finalSelection = normalized.slice(0, TIKTOK_CONFIG.maxProductsPerPlatform);

    this.logger.success(`Final selected products: ${finalSelection.length}`);
    return finalSelection;
  }
}