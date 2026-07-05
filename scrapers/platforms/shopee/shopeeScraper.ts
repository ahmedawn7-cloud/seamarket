import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import { SHOPEE_CONFIG } from "./shopeeConfig";
import { RawProduct, NormalizedProduct, normalizeProduct } from "../../core/normalizeProduct";
import { scoreProduct, deduplicateProducts } from "../../core/productScorer";
import { ScraperLogger } from "../../core/logger";
import { randomDelay } from "../../core/rateLimiter";

export class ShopeeScraper {
  private logger = new ScraperLogger("Shopee");

  async run(): Promise<NormalizedProduct[]> {
    this.logger.info("Starting Shopee scraper via ZenRows API...");
    const candidates: RawProduct[] = [];
    
    const apiKey = process.env.SCRAPING_API_KEY;
    if (!apiKey) {
      this.logger.error("SCRAPING_API_KEY is missing from environment variables.");
      return [];
    }

    try {
      // Loop through categories/keywords and fetch search results via ZenRows
      for (const cat of SHOPEE_CONFIG.categories) {
        if (candidates.length >= SHOPEE_CONFIG.maxCandidatesPerPlatform) break;
        
        // Pick a random keyword for this category search
        const keyword = SHOPEE_CONFIG.keywords[Math.floor(Math.random() * SHOPEE_CONFIG.keywords.length)];
        const searchUrl = `https://shopee.com.my/search?keyword=${keyword}&page=0`;
        
        this.logger.info(`Fetching: ${keyword} in ${cat.category} via ZenRows`);
        
        await randomDelay(1000, 2000); // polite rate limit

        try {
          const response = await axios({
            url: "https://api.zenrows.com/v1/",
            method: "GET",
            params: {
              url: searchUrl,
              apikey: apiKey,
              premium_proxy: "true",
              js_render: "true"
            },
            timeout: 180000 // ZenRows bypass mode can take 15-45 seconds, but Shopee requires more rendering time
          });

          const html = response.data;
          
          // Debug DOM dump
          fs.writeFileSync('shopee_debug_dump.html', html);
          this.logger.info('Saved raw HTML to shopee_debug_dump.html for inspection.');

          const $ = cheerio.load(html);
          
          const items: any[] = [];
          
          // Use our existing DOM selector logic, ported to Cheerio
          $('a[data-sqe="link"]').each((_, el) => {
            const url = $(el).attr('href');
            // Ensure absolute URL
            const absoluteUrl = url && url.startsWith('http') ? url : `https://shopee.com.my${url}`;
            const img = $(el).find('img').attr('src') || null;
            const textContent = $(el).text() || "";
            
            if (url) {
              items.push({
                url: absoluteUrl,
                image: img,
                rawText: textContent
              });
            }
          });

          this.logger.info(`Extracted ${items.length} raw cards from ${keyword}`);

          // Parse extracted items exactly as before
          for (const item of items) {
            if (!item.url || !item.rawText) continue;

            const priceMatch = item.rawText.match(/RM([0-9,.]+)/);
            const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, "")) : null;

            const salesMatch = item.rawText.match(/([0-9.,]+k?)\s*sold/i);
            let sales = null;
            if (salesMatch) {
              let sStr = salesMatch[1].toLowerCase();
              if (sStr.includes("k")) sales = parseFloat(sStr.replace("k", "")) * 1000;
              else sales = parseFloat(sStr.replace(/,/g, ""));
            }

            let title = item.rawText.split("RM")[0].trim();
            if (title.length < 5) title = `Trending Shopee Product (${keyword})`; // fallback

            candidates.push({
              platform: "Shopee",
              product_name: title,
              image_url: item.image || "https://dummyimage.com/600x400/ccc/000&text=No+Image",
              product_url: item.url,
              price_rm: price,
              sales: sales,
              rating_score: null,
              review_count: null,
              category: cat.category,
              source_keyword: keyword,
              source_category: cat.category,
              source_url: searchUrl,
              raw_platform_data: item
            });
          }
        } catch (apiError: any) {
          // Gracefully catch API errors so we don't crash the entire scraper stream
          const errorDetails = apiError.response?.data ? JSON.stringify(apiError.response.data) : apiError.message;
          this.logger.error(`ZenRows API error for ${keyword}: ${errorDetails}`);
          continue; 
        }
      }
    } catch (e) {
      this.logger.error("Error during Shopee scraping execution", e);
    }

    this.logger.success(`Collected ${candidates.length} raw candidates from Shopee.`);

    // Keep the exact same mapping and scoring logic
    let normalized = candidates.map(normalizeProduct);
    normalized = normalized.map(scoreProduct);
    normalized = deduplicateProducts(normalized);

    normalized.sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));
    
    const finalSelection = normalized.slice(0, SHOPEE_CONFIG.maxProductsPerPlatform);

    this.logger.success(`Final selected products: ${finalSelection.length}`);
    return finalSelection;
  }
}
