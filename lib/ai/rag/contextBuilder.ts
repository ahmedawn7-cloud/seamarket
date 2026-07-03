export function buildContextString(data: any[]): string {
  if (!data || data.length === 0) return "No relevant database context found.";

  // Compress the JSON heavily so it doesn't blow up the context window
  const compressed = data.map((item, index) => {
    const lines = [`Item ${index + 1}:`];
    
    // Flatten clean data
    if (item.clean_name_ai) lines.push(`Name: ${item.clean_name_ai}`);
    if (item.cleaned_products?.clean_name_ai) lines.push(`Name: ${item.cleaned_products.clean_name_ai}`);
    
    // Flatten scores
    const scores = item.product_scores && Array.isArray(item.product_scores) ? item.product_scores[0] : item.product_scores;
    if (scores) {
      lines.push(`AI Score: ${scores.ai_score}`);
      lines.push(`Risk Score: ${scores.risk_score}`);
      lines.push(`Rec: ${scores.final_recommendation}`);
    } else if (item.ai_score !== undefined) {
      lines.push(`AI Score: ${item.ai_score}`);
      lines.push(`Risk Score: ${item.risk_score}`);
      lines.push(`Rec: ${item.final_recommendation}`);
    }

    // Flatten research
    const pr = item.product_research && Array.isArray(item.product_research) ? item.product_research[0] : item.product_research;
    if (pr) {
      lines.push(`Summary: ${pr.business_summary}`);
      lines.push(`Launch Diff: ${pr.launch_difficulty}`);
    }

    return lines.join(" | ");
  });

  return compressed.join("\n\n");
}
