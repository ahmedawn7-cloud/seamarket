import { clamp } from "./scoreUtils";

export function calculateSupplierScore(suppliers: any[]): { score: number; note: string } {
  if (!suppliers || suppliers.length === 0) {
    return { score: 20, note: "Supplier data is completely missing. Manual sourcing required." };
  }

  let score = 20;

  const hasLocal = suppliers.some(s => s.supplier_type === "local_possible");
  const hasIntl = suppliers.some(s => s.supplier_type === "international_possible");

  if (hasLocal) score += 40;
  if (hasIntl) score += 20;

  const bestLeadTime = Math.min(...suppliers.map(s => s.estimated_lead_time_days || 999));
  if (bestLeadTime <= 3) score += 20;
  else if (bestLeadTime <= 7) score += 10;

  const bestMoq = Math.min(...suppliers.map(s => s.estimated_moq || 99999));
  if (bestMoq <= 10) score += 10;
  
  if (suppliers.some(s => s.supplier_confidence === "high")) {
    score += 10;
  }

  return { 
    score: clamp(score), 
    note: score > 75 ? "Excellent sourcing options available." : 
          score > 40 ? "Reasonable sourcing options." : "Sourcing may be difficult or slow."
  };
}
