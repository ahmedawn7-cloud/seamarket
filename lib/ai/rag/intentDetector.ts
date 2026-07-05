import { AIRouter } from "../AIRouter";

export type DetectedIntent = 
  | "product_search"
  | "product_comparison"
  | "supplier_search"
  | "supplier_compare"
  | "profit_question"
  | "marketplace_question"
  | "regulation_question"
  | "marketing_question"
  | "listing_generation"
  | "trend_question"
  | "opportunity_question"
  | "risk_question"
  | "dashboard_help"
  | "general_business"
  | "unsupported";

export async function detectIntent(question: string, botName: string = "Research Hub Chatbot"): Promise<DetectedIntent> {
  // Simple heuristic/keyword fallback first for speed/safety
  const text = question.toLowerCase();
  if (text.includes("compare") && text.includes("supplier")) return "supplier_compare";
  if (text.includes("compare") && (text.includes("product") || text.includes("item"))) return "product_comparison";
  if (text.includes("marketing") || text.includes("title") || text.includes("seo") || text.includes("description") || text.includes("ad ")) return "marketing_question";
  if (text.includes("sirim") || text.includes("kkm") || text.includes("npra") || text.includes("customs") || text.includes("regulation") || text.includes("legal")) return "regulation_question";
  if (text.includes("supplier") || text.includes("sourcing") || text.includes("moq") || text.includes("lead time") || text.includes("factory")) return "supplier_search";
  if (text.includes("profit") || text.includes("margin") || text.includes("roi") || text.includes("cogs")) return "profit_question";
  if (text.includes("risk") || text.includes("dangerous") || text.includes("safe")) return "risk_question";
  if (text.includes("opportunity") || text.includes("should i sell")) return "opportunity_question";
  if (text.includes("trend") || text.includes("popular")) return "trend_question";
  if (text.includes("shopee") || text.includes("lazada") || text.includes("tiktok") || text.includes("platform") || text.includes("fee")) return "marketplace_question";

  // Unsupported domain hard checks
  const unsupportedKeywords = ["politics", "religion", "medical", "doctor", "health advice", "programming", "code", "entertainment", "movie", "song", "trivia", "joke"];
  if (unsupportedKeywords.some(kw => text.includes(kw))) {
    return "unsupported";
  }

  // Fallback to LLM if ambiguous
  const prompt = `Classify this user question into one of the following exact categories: 
product_search, product_comparison, supplier_search, supplier_compare, profit_question, marketplace_question, regulation_question, marketing_question, listing_generation, trend_question, opportunity_question, risk_question, dashboard_help, general_business, unsupported.

Question: "${question}"
Return ONLY the category name. No other text.`;

  try {
    const aiResult = await AIRouter.execute({
      botName,
      prompt,
      requestType: "intent_detection"
    });
    const output = aiResult.response.content.trim().toLowerCase();
    
    const validIntents = [
      "product_search", "product_comparison", "supplier_search", "supplier_compare", 
      "profit_question", "marketplace_question", "regulation_question", "marketing_question", 
      "listing_generation", "trend_question", "opportunity_question", "risk_question", 
      "dashboard_help", "general_business", "unsupported"
    ];

    if (validIntents.includes(output)) {
      return output as DetectedIntent;
    }
    
    return "general_business";
  } catch (error) {
    console.error("Intent detection failed, defaulting to general_business", error);
    return "general_business";
  }
}
