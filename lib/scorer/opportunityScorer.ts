import { clamp } from "./scoreUtils";

export function calculateOpportunityScore(
  demandScore: number,
  trendScore: number,
  profitScore: number,
  supplierScore: number,
  regulatoryScore: number,
  competitionScore: number,
  riskScore: number
): number {
  
  // Weights based on business logic requirements
  const score = 
    (demandScore * 0.30) +
    (trendScore * 0.20) +
    (profitScore * 0.20) +
    (supplierScore * 0.15) +
    (regulatoryScore * 0.15) -
    (competitionScore * 0.15) -
    (riskScore * 0.15);

  return clamp(score);
}
