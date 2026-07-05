import { ruleBasedCleanName } from "./dataNormalizer";

export interface AIEnrichmentResult {
  clean_name_ai: string;
  demand_score: number;
  competition_score: number;
  trend_score: number;
  opportunity_score: number;
  risk_score: number;
  margin_signal: "High" | "Medium" | "Low" | "Unknown";
  supplier_readiness_score: number;
  product_verdict: "Sell" | "Watch" | "Avoid";
  ai_reasoning_summary: string;
  next_best_action: string;
}

export async function enrichProduct(name: string, price: number | null, category: string): Promise<AIEnrichmentResult> {
  // 1. Try Ollama (Local & Free)
  const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const ollamaModel = process.env.OLLAMA_MODEL || "llama3.1:8b";
  
  const prompt = `You are an expert E-commerce Product Analyst. Analyze this raw product data and return a JSON object with scores and insights.
Product Name: ${name}
Price: ${price ? "RM " + price : "Unknown"}
Category: ${category}

Respond strictly with valid JSON matching this schema:
{
  "clean_name_ai": "A concise, professional English name for the product",
  "demand_score": 0-100,
  "competition_score": 0-100,
  "trend_score": 0-100,
  "opportunity_score": 0-100,
  "risk_score": 0-100,
  "margin_signal": "High" or "Medium" or "Low" or "Unknown",
  "supplier_readiness_score": 0-100,
  "product_verdict": "Sell" or "Watch" or "Avoid",
  "ai_reasoning_summary": "1-2 sentence explanation",
  "next_best_action": "1 sentence recommendation"
}`;

  try {
    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: prompt,
        stream: false,
        format: "json"
      }),
      // Short timeout to fallback quickly if Ollama is off
      signal: AbortSignal.timeout(8000)
    });
    
    if (res.ok) {
      const data = await res.json();
      return JSON.parse(data.response);
    }
  } catch (e) {
    console.warn(`[AI] Ollama failed, attempting Groq fallback...`);
  }

  // 2. Try Groq (Optional Fallback)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: "llama3-8b-8192", // Fast model
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        }),
        signal: AbortSignal.timeout(5000)
      });

      if (res.ok) {
        const data = await res.json();
        return JSON.parse(data.choices[0].message.content);
      }
    } catch (e) {
      console.warn(`[AI] Groq failed, applying rule-based fallback...`);
    }
  }

  // 3. Rule-based Deterministic Fallback
  console.warn(`[AI] Using deterministic fallback for: ${name.substring(0, 30)}...`);
  return {
    clean_name_ai: ruleBasedCleanName(name),
    demand_score: 50,
    competition_score: 50,
    trend_score: 50,
    opportunity_score: 50,
    risk_score: 50,
    margin_signal: price && price > 50 ? "High" : "Medium",
    supplier_readiness_score: 50,
    product_verdict: "Watch",
    ai_reasoning_summary: "AI services unavailable. Baseline scores applied.",
    next_best_action: "Review manually."
  };
}
