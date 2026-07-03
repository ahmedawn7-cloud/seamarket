import { clamp } from "./scoreUtils";

// Higher means safer regulatory profile
export function calculateRegulatoryScore(reg: any): { score: number; note: string } {
  if (!reg) return { score: 40, note: "Unknown regulatory risk. Proceed with caution." };

  let score = 90; // Start safe
  const notes: string[] = [];

  const penalize = (riskLevel: string, penalty: number, reason: string) => {
    if (riskLevel === "high") {
      score -= penalty;
      notes.push(`High ${reason} risk detected.`);
    } else if (riskLevel === "medium") {
      score -= (penalty / 2);
    }
  };

  penalize(reg.sirim_risk, 35, "SIRIM");
  penalize(reg.kkm_risk, 40, "KKM");
  penalize(reg.npra_risk, 35, "NPRA");
  penalize(reg.customs_risk, 20, "Customs");
  penalize(reg.restricted_product_risk, 50, "Restricted Product");

  score = clamp(score);

  return {
    score,
    note: notes.length > 0 ? notes.join(" ") : "No major regulatory flags detected."
  };
}
