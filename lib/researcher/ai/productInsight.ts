export interface ProductInsightResult {
  product_summary: string;
  target_customer: string;
  demand_signals: string[];
  competition_signals: string[];
  product_risks: string[];
  launch_difficulty: "Low" | "Medium" | "High";
  marketing_angles: string[];
  suggested_keywords: string[];
}

export async function getProductInsight(clean_name: string, category: string): Promise<ProductInsightResult> {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const ollamaModel = process.env.OLLAMA_MODEL || "llama3.1:8b";
  
  const prompt = `You are an expert E-commerce Market Researcher. Analyze this product for the Malaysian market.
Product Name: ${clean_name}
Category: ${category}

Respond strictly with valid JSON matching this schema:
{
  "product_summary": "1 sentence description",
  "target_customer": "Who buys this? (1 sentence)",
  "demand_signals": ["signal 1", "signal 2"],
  "competition_signals": ["signal 1", "signal 2"],
  "product_risks": ["risk 1", "risk 2"],
  "launch_difficulty": "Low" or "Medium" or "High",
  "marketing_angles": ["angle 1", "angle 2"],
  "suggested_keywords": ["kw1", "kw2", "kw3"]
}`;

  try {
    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: ollamaModel, prompt, stream: false, format: "json" }),
      signal: AbortSignal.timeout(10000)
    });
    if (res.ok) {
      const data = await res.json();
      return JSON.parse(data.response);
    }
  } catch (e) {
    console.warn(`[AI] Ollama failed for product insight, attempting Groq fallback...`);
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        }),
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const data = await res.json();
        return JSON.parse(data.choices[0].message.content);
      }
    } catch (e) {
      console.warn(`[AI] Groq failed, applying rule-based fallback...`);
    }
  }

  console.warn(`[AI] Using deterministic fallback for product insight: ${clean_name.substring(0, 30)}`);
  return {
    product_summary: "A standard ecommerce product in " + category,
    target_customer: "General consumers",
    demand_signals: ["Consistent search volume"],
    competition_signals: ["Multiple sellers exist"],
    product_risks: ["Standard market competition"],
    launch_difficulty: "Medium",
    marketing_angles: ["Quality and affordability", "Fast shipping"],
    suggested_keywords: [category.toLowerCase(), "buy online", "malaysia"]
  };
}
