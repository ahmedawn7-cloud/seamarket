import { clamp } from "./scoreUtils";

export function calculateAiScore(
  opportunityScore: number,
  demandScore: number,
  trendScore: number,
  profitScore: number,
  supplierScore: number,
  regulatoryScore: number,
  riskScore: number
): number {
  
  const score = 
    (opportunityScore * 0.40) +
    (demandScore * 0.15) +
    (trendScore * 0.15) +
    (profitScore * 0.15) +
    (supplierScore * 0.10) +
    (regulatoryScore * 0.05) -
    (riskScore * 0.10);

  return clamp(score);
}
