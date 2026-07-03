import { clamp, scaleValue } from "./scoreUtils";

// Higher means more competitive (worse)
export function calculateCompetitionScore(scrapedData: any, productResearch: any): { score: number; note: string } {
  let score = 30; // Baseline competition
  
  if (scrapedData) {
    if (scrapedData.review_count !== null && scrapedData.review_count !== undefined) {
      score += scaleValue(scrapedData.review_count, 0, 5000, 0, 40);
    }
    
    if (scrapedData.sales !== null && scrapedData.sales !== undefined) {
      score += scaleValue(scrapedData.sales, 0, 20000, 0, 20);
    }
  }

  if (productResearch && productResearch.competition_signals && productResearch.competition_signals.length > 0) {
    score += 10 * productResearch.competition_signals.length;
  }

  score = clamp(score);

  return { 
    score, 
    note: score > 75 ? "Extremely competitive market for this product." : 
          score > 40 ? "Moderate competition." : "Low competition."
  };
}
