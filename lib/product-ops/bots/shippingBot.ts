import { BotContext } from "./types";
import { saveBotResult, logBotRun } from "./saveBotResult";

export async function runShippingBot(context: BotContext) {
  const started_at = new Date();
  const { product } = context;

  try {
    const isElectronics = product.category.toLowerCase().includes("electronic");
    const isBeauty = product.category.toLowerCase().includes("beauty");
    
    const result = {
      shipping_origin: "China / Local Warehouse",
      ships_to_malaysia: true,
      estimated_shipping_days: 7,
      estimated_shipping_cost_rm: 4.50,
      shipping_restrictions: (isElectronics || isBeauty) ? "May require special handling." : "None",
      battery_or_liquid_warning: (isElectronics || isBeauty),
      fragile_warning: false,
      customs_warning: false,
      shipping_risk_score: (isElectronics || isBeauty) ? 40 : 10,
      shipping_notes: "Generated placeholder: Standard cross-border shipping applies. 7-14 days average transit time."
    };

    await saveBotResult(product.id, "shipping_research", result);
    await logBotRun(product.id, "shippingBot", "success", started_at, new Date());
    
    return result;
  } catch (err: any) {
    await logBotRun(product.id, "shippingBot", "failed", started_at, new Date(), err.message);
    throw err;
  }
}
