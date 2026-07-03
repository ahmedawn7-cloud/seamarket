export function calculateResearchConfidence(dataDensity: number): "low" | "medium" | "high" {
  if (dataDensity < 30) return "low";
  if (dataDensity < 70) return "medium";
  return "high";
}
