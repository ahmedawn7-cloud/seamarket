import { ProductIntake, BotContext } from "./types";
import { runMarketResearchBot } from "./marketResearchBot";
import { runSupplierResearchBot } from "./supplierResearchBot";
import { runShippingBot } from "./shippingBot";
import { runPlatformPolicyBot } from "./platformPolicyBot";
import { runPerformanceTrackingBot } from "./performanceTrackingBot";
import { runRankingBot } from "./rankingBot";
import { supabaseAdmin } from "./saveBotResult";

export async function runAllBots(product: ProductIntake) {
  const context: BotContext = { product };

  try {
    // 1. Mark as researching
    await supabaseAdmin
      .from("product_intake")
      .update({ status: "researching" })
      .eq("id", product.id);

    // 2. Initialize research record
    const { error: initError } = await supabaseAdmin
      .from("product_bot_research")
      .upsert({
        product_intake_id: product.id,
        week_label: product.week_label,
        research_status: "researching"
      }, { onConflict: "product_intake_id" });

    if (initError) throw initError;

    // 3. Run individual bots concurrently where possible, or sequentially to avoid DB lock issues
    // We'll run them sequentially to ensure stable writes to the JSONB columns
    await runMarketResearchBot(context);
    await runSupplierResearchBot(context);
    await runShippingBot(context);
    await runPlatformPolicyBot(context);
    await runPerformanceTrackingBot(context);

    // 4. Run ranking bot last because it depends on others
    await runRankingBot(context);

    // 5. Update intake status
    await supabaseAdmin
      .from("product_intake")
      .update({ status: "research_completed" })
      .eq("id", product.id);

  } catch (error: any) {
    console.error(`Error running bots for product ${product.id}:`, error);
    await supabaseAdmin
      .from("product_intake")
      .update({ status: "research_failed" })
      .eq("id", product.id);
      
    await supabaseAdmin
      .from("product_bot_research")
      .update({ research_status: "research_failed", research_error: error.message })
      .eq("product_intake_id", product.id);
  }
}
