import { BotContext } from "./types";
import { saveBotResult, logBotRun } from "./saveBotResult";

export async function runSupplierResearchBot(context: BotContext) {
  const started_at = new Date();
  const { product } = context;

  try {
    const query = encodeURIComponent(product.product_name);
    
    // Heuristic estimation
    const cogs = product.price_rm > 0 ? (product.price_rm * 0.4).toFixed(2) : "0.00";
    
    const result = {
      supplier_urls: [], // Real scraping would find exact URLs
      supplier_search_urls: [
        `https://www.alibaba.com/trade/search?SearchText=${query}`,
        `https://www.aliexpress.com/wholesale?SearchText=${query}`,
        `https://s.1688.com/selloffer/offer_search.htm?keywords=${query}`
      ],
      estimated_cogs_rm: parseFloat(cogs),
      estimated_moq: product.price_rm > 100 ? 5 : 50,
      supplier_locations: ["Mainland China", "Guangdong"],
      local_supplier_available: false,
      international_supplier_available: true,
      supplier_availability_score: 75,
      supplier_confidence: 80,
      notes: "Generated placeholder: High likelihood of sourcing from China. Local wholesalers might stock this, but direct import yields better margins."
    };

    await saveBotResult(product.id, "supplier_research", result);
    await logBotRun(product.id, "supplierResearchBot", "success", started_at, new Date());
    
    return result;
  } catch (err: any) {
    await logBotRun(product.id, "supplierResearchBot", "failed", started_at, new Date(), err.message);
    throw err;
  }
}
