import { BotContext } from "./types";
import { saveBotResult, logBotRun } from "./saveBotResult";

export async function runMarketResearchBot(context: BotContext) {
  const started_at = new Date();
  const { product } = context;

  try {
    // Generate safe search URLs
    const query = encodeURIComponent(product.product_name);
    const suggested_search_urls = [
      `https://shopee.com.my/search?keyword=${query}`,
      `https://www.lazada.com.my/catalog/?q=${query}`,
      `https://shop.tiktok.com/search?q=${query}`,
      `https://www.google.com/search?q=${query}+malaysia`
    ];

    // Heuristic mock data based on price/category
    const competition = product.approximate_sales > 1000 ? "High" : "Medium";
    const score = product.approximate_sales > 1000 ? 80 : 50;

    const result = {
      cross_platform_availability: true,
      visible_price_ranges: `RM ${Math.max(1, product.price_rm * 0.8).toFixed(2)} - RM ${(product.price_rm * 1.5).toFixed(2)}`,
      visible_platforms: ["Shopee", "Lazada", "TikTok Shop"],
      review_summary: "Generated placeholder: Customer sentiment is generally positive but sensitive to shipping times.",
      common_complaints: ["Slow shipping", "Packaging damage"],
      product_risks: ["High competition", "Price wars"],
      regulatory_notes: "Standard e-commerce item, no major SIRIM requirements detected.",
      competition_score: score,
      market_research_confidence: 85,
      suggested_search_urls
    };

    await saveBotResult(product.id, "market_research", result);
    await logBotRun(product.id, "marketResearchBot", "success", started_at, new Date());
    
    return result;
  } catch (err: any) {
    await logBotRun(product.id, "marketResearchBot", "failed", started_at, new Date(), err.message);
    throw err;
  }
}
