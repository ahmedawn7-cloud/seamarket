export function buildCitations(tables: string[]): string[] {
  // Simple mapping of raw table names to human readable citations
  const map: Record<string, string> = {
    "scraped_products": "Marketplace Data",
    "cleaned_products": "Normalized Data",
    "product_research": "AI Product Research",
    "supplier_research": "Supplier Intelligence",
    "regulatory_research": "Compliance Flags",
    "product_scores": "Business Scores"
  };

  return tables.map(t => map[t] || t);
}
