import { BotContext } from "./types";
import { saveBotResult, logBotRun, supabaseAdmin } from "./saveBotResult";

export async function runRankingBot(context: BotContext) {
  const started_at = new Date();
  const { product } = context;

  try {
    // Read previous bot results to calculate final score
    const { data: research } = await supabaseAdmin
      .from("product_bot_research")
      .select("*")
      .eq("product_intake_id", product.id)
      .single();

    let final_opportunity_score = 50;
    let final_risk_score = 10;
    
    if (research) {
      if (research.market_research?.competition_score < 60) final_opportunity_score += 15;
      if (research.supplier_research?.supplier_availability_score > 70) final_opportunity_score += 15;
      if (research.shipping_research?.shipping_risk_score > 30) final_risk_score += 20;
      if (research.platform_policy_research?.policy_risk_score > 50) final_risk_score += 40;
    }

    let final_recommendation = "Test";
    if (final_risk_score > 50) final_recommendation = "Avoid";
    else if (final_opportunity_score > 70 && final_risk_score < 20) final_recommendation = "Push";
    else if (final_opportunity_score < 40) final_recommendation = "Watch";

    const result = {
      final_opportunity_score,
      final_risk_score,
      margin_potential_score: 80,
      competition_score: research?.market_research?.competition_score || 50,
      supplier_score: research?.supplier_research?.supplier_availability_score || 50,
      shipping_score: 100 - (research?.shipping_research?.shipping_risk_score || 10),
      regulatory_score: 100 - (research?.platform_policy_research?.policy_risk_score || 10),
      policy_score: 100 - (research?.platform_policy_research?.policy_risk_score || 10),
      final_recommendation,
      recommended_category: product.category,
      recommended_platform: product.platform,
      reason_summary: `Scored ${final_opportunity_score}/100. ${final_recommendation} this product based on risk and margin profile.`,
      action_plan: `Proceed with ${final_recommendation.toLowerCase()} phase. Secure supplier quotes and setup listing.`
    };

    // For ranking bot, we update the top level columns as well
    const { error: updateError } = await supabaseAdmin
      .from("product_bot_research")
      .update({
        ranking_result: result,
        final_opportunity_score: result.final_opportunity_score,
        final_risk_score: result.final_risk_score,
        final_recommendation: result.final_recommendation,
        recommended_platform: result.recommended_platform,
        recommended_category: result.recommended_category,
        research_status: "research_completed",
        updated_at: new Date().toISOString()
      })
      .eq("product_intake_id", product.id);

    if (updateError) throw updateError;
    
    await logBotRun(product.id, "rankingBot", "success", started_at, new Date());
    return result;
  } catch (err: any) {
    await logBotRun(product.id, "rankingBot", "failed", started_at, new Date(), err.message);
    throw err;
  }
}
