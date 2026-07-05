import axios from "axios";
import { LAZADA_CONFIG } from "./lazadaConfig";
import { RawProduct, NormalizedProduct, normalizeProduct } from "../../core/normalizeProduct";
import { scoreProduct, deduplicateProducts } from "../../core/productScorer";
import { ScraperLogger } from "../../core/logger";

export class LazadaScraper {
  private logger = new ScraperLogger("Lazada");

  async run(keywordInput?: string): Promise<NormalizedProduct[]> {
    this.logger.info("Starting Lazada scraper via Bright Data API...");
    const candidates: RawProduct[] = [];
    
    const token = process.env.BRIGHT_DATA_API_TOKEN;
    const datasetId = process.env.LAZADA_DATASET_ID;
    
    if (!token || !datasetId) {
      this.logger.error("BRIGHT_DATA_API_TOKEN or LAZADA_DATASET_ID is missing from environment variables.");
      return [];
    }

    const keywordsToScrape = keywordInput ? [keywordInput] : LAZADA_CONFIG.keywords;

    try {
      for (const keyword of keywordsToScrape) {
        if (candidates.length >= LAZADA_CONFIG.maxCandidatesPerPlatform) break;
        
        this.logger.info(`Fetching: ${keyword} via Bright Data`);
        
        try {
          const targetUrl = `https://www.lazada.com.my/catalog/?q=${encodeURIComponent(keyword)}`;
          
          const response = await axios({
            url: "https://api.brightdata.com/datasets/v3/scrape",
            method: "POST",
            params: {
              dataset_id: datasetId,
              format: 'json'
            },
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            data: [{
              url: targetUrl
            }],
            timeout: 120000 // 120 seconds
          });

          const items = response.data || [];
          this.logger.info(`Extracted ${Array.isArray(items) ? items.length : 0} raw cards for ${keyword}`);

          if (!Array.isArray(items)) continue;

          for (const data of items) {
            // STRICT RULE: Remove seller data to protect privacy
            const safeData = { ...data };
            delete safeData.seller;
            delete safeData.seller_name;
            delete safeData.shop_name;
            delete safeData.shop;
            delete safeData.seller_url;
            delete safeData.shop_url;
            delete safeData.brand; // Sometimes brand names leak seller info if white-labeled

            candidates.push({
              platform: "Lazada",
              product_name: safeData.title || safeData.product_name || safeData.name || `Lazada Product (${keyword})`,
              image_url: safeData.image || safeData.image_url || "https://dummyimage.com/600x400/ccc/000&text=No+Image",
              product_url: safeData.url || safeData.product_url || targetUrl,
              price_rm: typeof safeData.price === 'number' ? safeData.price : parseFloat((safeData.price || "0").toString().replace(/[^0-9.]/g, '')) || null,
              sales: typeof safeData.sales === 'number' ? safeData.sales : parseInt((safeData.sales || safeData.sold || safeData.reviews || "0").toString().replace(/[^0-9]/g, '')) || null,
              rating_score: null, 
              review_count: null,
              category: "Lazada Trend", // Fallback category mapping
              source_keyword: keyword,
              source_category: "Lazada Trend",
              source_url: targetUrl,
              raw_platform_data: safeData
            });
          }
        } catch (apiError: any) {
          // Gracefully catch API errors and log payload
          const errorDetails = apiError.response?.data ? JSON.stringify(apiError.response.data) : apiError.message;
          this.logger.error(`Bright Data API error for ${keyword}: ${errorDetails}`);
          continue; 
        }
      }
    } catch (e) {
      this.logger.error("Error during Lazada scraping execution", e);
    }

    this.logger.success(`Collected ${candidates.length} raw candidates from Lazada.`);

    let normalized = candidates.map(normalizeProduct);
    
    // Explicitly enforce mapping rules from the requirements
    normalized = normalized.map(p => ({
      ...p,
      competition_score: 0,
      opportunity_score: 0,
      regulatory_risk_score: 0,
      platform_fee_pct: 0
    }));

    normalized = normalized.map(scoreProduct);
    normalized = deduplicateProducts(normalized);

    normalized.sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));
    const finalSelection = normalized.slice(0, LAZADA_CONFIG.maxProductsPerPlatform);

    this.logger.success(`Final selected products: ${finalSelection.length}`);
    return finalSelection;
  }
}
