import { BotContext } from "./types";
import { saveBotResult, logBotRun } from "./saveBotResult";

export async function runPerformanceTrackingBot(context: BotContext) {
  const started_at = new Date();
  const { product } = context;

  try {
    const result = {
      google_visibility_score: 80,
      platform_visibility_score: 90,
      competition_change: "Stable",
      price_change: "None",
      trend_decay_score: 20,
      tracking_notes: "Generated placeholder: Product shows stable search volume over the last 30 days.",
      next_check_recommendation: "7 days"
    };

    await saveBotResult(product.id, "performance_tracking", result);
    await logBotRun(product.id, "performanceTrackingBot", "success", started_at, new Date());
    
    return result;
  } catch (err: any) {
    await logBotRun(product.id, "performanceTrackingBot", "failed", started_at, new Date(), err.message);
    throw err;
  }
}
