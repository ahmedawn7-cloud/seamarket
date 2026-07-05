import { BotContext } from "./types";
import { saveBotResult, logBotRun } from "./saveBotResult";

export async function runPlatformPolicyBot(context: BotContext) {
  const started_at = new Date();
  const { product } = context;

  try {
    const isBeauty = product.category.toLowerCase().includes("beauty");
    const isHealth = product.category.toLowerCase().includes("health");
    
    const result = {
      shopee_policy_risk: isHealth ? "High - Requires KKM approval" : "Low",
      lazada_policy_risk: isHealth ? "High - Requires KKM approval" : "Low",
      tiktok_policy_risk: isBeauty || isHealth ? "High - Invite only category or strict review" : "Medium",
      restricted_category_warning: (isBeauty || isHealth),
      logistics_timeframe_notes: "Platform standard 2-3 days fulfillment required.",
      damaged_goods_return_notes: "Standard 15-day return policy applies.",
      warranty_or_refund_risk: "Low",
      recommended_platforms: ["Shopee", "Lazada"],
      avoid_platforms: (isBeauty || isHealth) ? ["TikTok Shop"] : [],
      policy_risk_score: (isBeauty || isHealth) ? 75 : 15
    };

    await saveBotResult(product.id, "platform_policy_research", result);
    await logBotRun(product.id, "platformPolicyBot", "success", started_at, new Date());
    
    return result;
  } catch (err: any) {
    await logBotRun(product.id, "platformPolicyBot", "failed", started_at, new Date(), err.message);
    throw err;
  }
}
