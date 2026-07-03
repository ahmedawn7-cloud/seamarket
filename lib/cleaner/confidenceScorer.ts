import { ScrapedProduct, CleanedProduct } from "./types";

export function generateConfidenceScore(
  raw: ScrapedProduct, 
  partialClean: Partial<CleanedProduct>
): number {
  let score = 100;

  if (!partialClean.normalized_brand) score -= 10;
  if (!partialClean.normalized_category || partialClean.normalized_category === "Other") score -= 10;
  
  if (raw.rating_score === null || raw.rating_score === undefined) score -= 10;
  if (raw.review_count === null || raw.review_count === undefined) score -= 10;
  if (raw.sales === null || raw.sales === undefined) score -= 10;
  
  if (!raw.image_url) score -= 20;
  if (!raw.product_url) score -= 30;

  if (partialClean.validation_status === "invalid") {
    score = Math.min(score, 40); // Cap at 40
  }

  if (partialClean.is_duplicate) score -= 10;
  if (partialClean.language === "unknown") score -= 5;

  return Math.max(0, Math.min(100, score));
}
