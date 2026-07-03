import { clamp } from "./scoreUtils";

// Higher means more risky (worse)
export function calculateRiskScore(
  regulatoryScore: number, 
  productResearch: any,
  validationStatus: string,
  researchConfidence: string
): { score: number; note: string } {
  let score = 20; // Baseline business risk

  // Regulatory risk inversion (100-regScore)
  score += (100 - regulatoryScore) * 0.4;

  if (validationStatus === "warning") {
    score += 15;
  }

  if (researchConfidence === "low") {
    score += 10;
  }

  if (productResearch) {
    if (productResearch.launch_difficulty === "high") score += 20;
    if (productResearch.launch_difficulty === "medium") score += 10;

    if (productResearch.product_risks && productResearch.product_risks.length > 0) {
      score += (productResearch.product_risks.length * 5);
    }
    
    if (productResearch.shipping_risks && productResearch.shipping_risks.length > 0) {
      score += (productResearch.shipping_risks.length * 5);
    }
  }

  score = clamp(score);

  return {
    score,
    note: score > 75 ? "Extremely high risk profile. Proceed with extreme caution." :
          score > 45 ? "Moderate risk profile." : "Low risk profile."
  };
}
