export interface FormattedResponse {
  answer: string;
  sources: string[];
  recommendations: string[];
}

export function parseLlmResponse(raw: string, dbSources: string[]): FormattedResponse {
  // If fallback message is triggered
  if (raw.includes("designed specifically for ecommerce intelligence")) {
    return {
      answer: raw,
      sources: [],
      recommendations: []
    };
  }

  // Parse sections
  const answerStr = raw;
  
  // Extract recommendations if available
  const recMatch = raw.match(/Recommendations\n([\s\S]*?)(?=\nSources Used|\nDisclaimer|$)/i);
  const recommendations = recMatch 
    ? recMatch[1].split('\n').map(s => s.replace(/^- /, '').trim()).filter(Boolean)
    : [];

  return {
    answer: answerStr,
    sources: dbSources,
    recommendations
  };
}
