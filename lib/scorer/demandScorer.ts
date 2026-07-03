import { clamp, scaleValue } from "./scoreUtils";

export function calculateDemandScore(scrapedData: any): { score: number; note: string } {
  if (!scrapedData) return { score: 30, note: "No raw scraped data available for demand scoring." };

  let score = 0;
  let hasMissing = false;

  // Sales Strength (40%)
  if (scrapedData.sales !== null && scrapedData.sales !== undefined) {
    // Scale: 0 sales = 0, 10k sales = 40
    score += scaleValue(scrapedData.sales, 0, 10000, 0, 40);
  } else {
    hasMissing = true;
  }

  // Review Strength (20%)
  if (scrapedData.review_count !== null && scrapedData.review_count !== undefined) {
    // Scale: 0 reviews = 0, 1000 reviews = 20
    score += scaleValue(scrapedData.review_count, 0, 1000, 0, 20);
  } else {
    hasMissing = true;
  }

  // Rating Strength (15%)
  if (scrapedData.rating_score !== null && scrapedData.rating_score !== undefined) {
    // Scale: 0 rating = 0, 5.0 rating = 15
    score += scaleValue(scrapedData.rating_score, 0, 5.0, 0, 15);
  } else {
    hasMissing = true;
  }

  // Trend Rank (25%)
  if (scrapedData.trend_rank !== null && scrapedData.trend_rank !== undefined) {
    // Inverse scale: rank 1 = 25, rank 100 = 0
    score += scaleValue(scrapedData.trend_rank, 1, 100, 25, 0);
  } else {
    hasMissing = true;
  }

  score = clamp(score);
  
  if (hasMissing) {
    return { score: clamp(score + 20), note: "Demand score estimated due to missing data." };
  }

  return { score, note: score > 70 ? "Strong demand signals detected." : "Moderate to low demand signals." };
}
