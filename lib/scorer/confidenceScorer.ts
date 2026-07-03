import { clamp } from "./scoreUtils";

export function calculateConfidenceScore(
  scrapedData: any, 
  productResearch: any, 
  suppliers: any[], 
  regulatoryResearch: any
): number {
  
  let score = 100;

  if (!scrapedData) {
    score -= 30;
  } else {
    if (scrapedData.sales === null) score -= 10;
    if (scrapedData.price_rm === null) score -= 10;
    if (scrapedData.rating_score === null) score -= 5;
    if (scrapedData.review_count === null) score -= 5;
  }

  if (!productResearch) {
    score -= 20;
  } else if (productResearch.research_confidence === "low") {
    score -= 10;
  }

  if (!suppliers || suppliers.length === 0) {
    score -= 15;
  }

  if (!regulatoryResearch) {
    score -= 10;
  }

  return clamp(score);
}
