export interface RegulatoryAnalysisResult {
  possible_regulatory_flags: string[];
  sirim_risk: "Low" | "Medium" | "High" | "None";
  kkm_risk: "Low" | "Medium" | "High" | "None";
  npra_risk: "Low" | "Medium" | "High" | "None";
  customs_risk: "Low" | "Medium" | "High" | "None";
  age_restriction_risk: "Low" | "Medium" | "High" | "None";
  restricted_product_risk: "Low" | "Medium" | "High" | "None";
  compliance_notes: string[];
}

export async function getRegulatoryAnalysis(clean_name: string, category: string): Promise<RegulatoryAnalysisResult> {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const ollamaModel = process.env.OLLAMA_MODEL || "llama3.1:8b";
  
  const prompt = `You are a Malaysian E-commerce Compliance Expert. Analyze this product for the Malaysian market.
Product Name: ${clean_name}
Category: ${category}

Evaluate the regulatory risks based on Malaysian authorities:
- SIRIM (for electronics, wireless, electrical appliances)
- KKM/NPRA (for beauty, skincare, health, supplements, food)
- Customs/import restrictions
- Counterfeit/trademark risk
- E-commerce Platform policy risk (Shopee/TikTok restrictions)

Respond strictly with valid JSON matching this schema:
{
  "possible_regulatory_flags": ["flag 1", "flag 2"],
  "sirim_risk": "Low", // Can be Low, Medium, High, or None
  "kkm_risk": "None",
  "npra_risk": "None",
  "customs_risk": "Low",
  "age_restriction_risk": "None",
  "restricted_product_risk": "Low",
  "compliance_notes": ["Note 1", "Note 2"]
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
    console.warn(`[AI] Ollama failed for regulatory analysis, attempting Groq fallback...`);
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

  console.warn(`[AI] Using deterministic fallback for regulatory analysis: ${clean_name.substring(0, 30)}`);
  
  const lowerCat = category.toLowerCase();
  const isElectronics = lowerCat.includes("electronic") || lowerCat.includes("appliance") || lowerCat.includes("computer");
  const isHealth = lowerCat.includes("health") || lowerCat.includes("beauty") || lowerCat.includes("skincare");

  return {
    possible_regulatory_flags: ["General import review"],
    sirim_risk: isElectronics ? "Medium" : "None",
    kkm_risk: isHealth ? "Medium" : "None",
    npra_risk: isHealth ? "Medium" : "None",
    customs_risk: "Low",
    age_restriction_risk: "None",
    restricted_product_risk: "Low",
    compliance_notes: ["Ensure accurate category listing", "Check platform policies for this product"]
  };
}
