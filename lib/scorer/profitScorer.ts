import { clamp, scaleValue } from "./scoreUtils";

// Higher means better profit margins
export function calculateProfitScore(scrapedData: any, suppliers: any[]): { score: number; note: string } {
  if (!scrapedData || scrapedData.price_rm === null || scrapedData.price_rm === undefined) {
    return { score: 30, note: "Profit score could not be calculated. Missing price data." };
  }

  const price = scrapedData.price_rm;
  
  // Platform fee proxy (8%)
  const estimatedFee = price * 0.08;
  
  // Try to find COGS from supplier data
  let cogs = null;
  if (suppliers && suppliers.length > 0) {
    const validCogs = suppliers.map(s => s.estimated_cogs_rm).filter(c => c !== null && c > 0);
    if (validCogs.length > 0) {
      cogs = Math.min(...validCogs);
    }
  }

  let isProxy = false;
  let estimatedMargin = 0;

  if (cogs) {
    estimatedMargin = price - estimatedFee - cogs;
  } else {
    // If COGS missing, assume a generous standard retail 50% margin proxy 
    // to keep the bot moving, but mark as proxy.
    cogs = price * 0.50; 
    estimatedMargin = price - estimatedFee - cogs;
    isProxy = true;
  }

  const marginPct = estimatedMargin / price;
  
  let score = scaleValue(marginPct * 100, 10, 60, 20, 100);

  // Reward higher absolute ticket items slightly (more raw profit)
  if (estimatedMargin > 50) score += 10;
  if (estimatedMargin > 100) score += 15;

  score = clamp(score);

  return {
    score,
    note: isProxy ? 
      "Profit score is estimated because actual supplier COGS is missing." : 
      `Solid estimated margin of RM ${estimatedMargin.toFixed(2)}.`
  };
}
