export interface SupplierEstimationResult {
  estimated_cogs_rm: number;
  estimated_moq: number;
  estimated_lead_time_days: number;
  supplier_type: string;
  sourcing_difficulty: "Low" | "Medium" | "High";
  supplier_questions_to_ask: string[];
  supplier_search_urls: {
    alibaba: string;
    aliexpress: string;
    cj_dropshipping: string;
    google: string;
    1688?: string;
  };
}

function generateSearchUrls(clean_name: string) {
  const encodedName = encodeURIComponent(clean_name);
  return {
    alibaba: `https://www.alibaba.com/trade/search?SearchText=${encodedName}`,
    aliexpress: `https://www.aliexpress.com/wholesale?SearchText=${encodedName}`,
    cj_dropshipping: `https://cjdropshipping.com/search/${encodedName}.html`,
    google: `https://www.google.com/search?q=${encodedName}+wholesale+supplier`,
    "1688": `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodedName}`
  };
}

export async function getSupplierEstimation(clean_name: string, price_rm: number | undefined): Promise<SupplierEstimationResult> {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const ollamaModel = process.env.OLLAMA_MODEL || "llama3.1:8b";
  
  const searchUrls = generateSearchUrls(clean_name);
  const retailPrice = price_rm ? `RM ${price_rm}` : "Unknown";

  const prompt = `You are a Sourcing & Supply Chain Expert. Estimate wholesale supplier metrics for this product.
Product Name: ${clean_name}
Retail Price in Malaysia: ${retailPrice}

Respond strictly with valid JSON matching this schema:
{
  "estimated_cogs_rm": 0, // Just a number, e.g. 15.50 (typically 20-40% of retail)
  "estimated_moq": 0, // Just a number, e.g. 100
  "estimated_lead_time_days": 0, // Just a number, e.g. 14
  "supplier_type": "e.g., 1688 Factory, Trading Company, Dropshipper",
  "sourcing_difficulty": "Low" or "Medium" or "High",
  "supplier_questions_to_ask": ["q1", "q2"]
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
      const parsed = JSON.parse(data.response);
      parsed.supplier_search_urls = searchUrls;
      return parsed;
    }
  } catch (e) {
    console.warn(`[AI] Ollama failed for supplier estimation, attempting Groq fallback...`);
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
        const parsed = JSON.parse(data.choices[0].message.content);
        parsed.supplier_search_urls = searchUrls;
        return parsed;
      }
    } catch (e) {
      console.warn(`[AI] Groq failed, applying rule-based fallback...`);
    }
  }

  console.warn(`[AI] Using deterministic fallback for supplier estimation: ${clean_name.substring(0, 30)}`);
  
  const estimatedCogs = price_rm ? parseFloat((price_rm * 0.35).toFixed(2)) : 10.0;
  
  return {
    estimated_cogs_rm: estimatedCogs,
    estimated_moq: 100,
    estimated_lead_time_days: 14,
    supplier_type: "General Trading Company",
    sourcing_difficulty: "Medium",
    supplier_questions_to_ask: ["What is your best MOQ?", "Do you provide OEM packaging?"],
    supplier_search_urls: searchUrls
  };
}
