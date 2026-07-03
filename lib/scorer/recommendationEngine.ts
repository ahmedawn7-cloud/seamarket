export function generateRecommendation(
  aiScore: number,
  riskScore: number,
  regulatoryScore: number,
  confidenceScore: number
): "source_now" | "watch" | "research_more" | "avoid" {
  
  // Hard failure limits
  if (regulatoryScore <= 30 || riskScore >= 75 || aiScore < 45) {
    return "avoid";
  }

  // Need more data
  if (confidenceScore < 60) {
    return "research_more";
  }

  // Source Now conditions
  if (aiScore >= 80 && riskScore <= 40 && regulatoryScore >= 60) {
    return "source_now";
  }

  // Watch conditions (Decent AI, manageable risk)
  if (aiScore >= 65 && riskScore <= 60) {
    return "watch";
  }

  // Fallback
  return "research_more";
}
