import { clamp, scaleValue } from "./scoreUtils";

// Lower rank number = higher trend score
export function calculateTrendScore(scrapedData: any): { score: number; note: string } {
  let score = 50; // Baseline
  
  if (!scrapedData) return { score, note: "No trend data available." };

  if (scrapedData.trend_rank !== null && scrapedData.trend_rank !== undefined) {
    score = scaleValue(scrapedData.trend_rank, 1, 100, 100, 20);
  } else if (scrapedData.internal_rank !== null && scrapedData.internal_rank !== undefined) {
    score = scaleValue(scrapedData.internal_rank, 1, 1000, 100, 20);
  }

  score = clamp(score);

  return { 
    score, 
    note: score > 80 ? "Highly trending product." : 
          score > 40 ? "Stable trend." : "Fading or low trend."
  };
}
