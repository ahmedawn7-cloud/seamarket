import { getServiceSupabaseClient } from "@/lib/supabase/serviceRoleClient";
import { ProductScore } from "./types";
import { createScorerRunLog, logScorerRun } from "./scorerLogger";
import { saveProductScore } from "./saveProductScore";

import { calculateDemandScore } from "./demandScorer";
import { calculateCompetitionScore } from "./competitionScorer";
import { calculateTrendScore } from "./trendScorer";
import { calculateSupplierScore } from "./supplierScorer";
import { calculateRegulatoryScore } from "./regulatoryScorer";
import { calculateRiskScore } from "./riskScorer";
import { calculateProfitScore } from "./profitScorer";
import { calculateOpportunityScore } from "./opportunityScorer";
import { calculateAiScore } from "./aiScorer";
import { calculateConfidenceScore } from "./confidenceScorer";
import { generateRecommendation } from "./recommendationEngine";

export async function runScorer(limit: number = 50) {
  let runId = "";
  try {
    runId = await createScorerRunLog(limit);

    const supabase = getServiceSupabaseClient();

    // Fetch valid cleaned products that haven't been scored yet
    // To do this properly without huge joins, we just fetch cleaned_products
    const { data: cleanedData, error: cleanedError } = await supabase
      .from("cleaned_products")
      .select(`
        *,
        scraped_products (*),
        product_research (*),
        supplier_research (*),
        regulatory_research (*)
      `)
      .neq("validation_status", "invalid")
      .order("cleaned_at", { ascending: false })
      .limit(limit * 2);

    if (cleanedError) throw cleanedError;

    if (!cleanedData || cleanedData.length === 0) {
      await logEmptyRun(runId, limit);
      return { success: true, processed: 0, scored: 0, source_now: 0, watch: 0, research_more: 0, avoid: 0, failed: 0 };
    }

    // Filter out already scored products
    const cleanedIds = cleanedData.map(p => p.id);
    const { data: alreadyScored } = await supabase
      .from("product_scores")
      .select("cleaned_product_id")
      .in("cleaned_product_id", cleanedIds);

    const alreadyScoredIds = new Set(alreadyScored?.map(r => r.cleaned_product_id) || []);
    
    const toProcess = cleanedData
      .filter(p => !alreadyScoredIds.has(p.id))
      .slice(0, limit);

    if (toProcess.length === 0) {
      await logEmptyRun(runId, limit);
      return { success: true, processed: 0, scored: 0, source_now: 0, watch: 0, research_more: 0, avoid: 0, failed: 0 };
    }

    const scoreBatch: Partial<ProductScore>[] = [];
    const stats = {
      scored: 0,
      source_now: 0,
      watch: 0,
      research_more: 0,
      avoid: 0,
      failed: 0
    };

    for (const data of toProcess) {
      try {
        const scraped = data.scraped_products;
        // Supabase returns arrays for one-to-many relationships (even if logically one-to-one based on setup)
        const pr = data.product_research && data.product_research.length > 0 ? data.product_research[0] : null;
        const rr = data.regulatory_research && data.regulatory_research.length > 0 ? data.regulatory_research[0] : null;
        const sr = data.supplier_research || []; // Array

        const { score: demandScore, note: demandNote } = calculateDemandScore(scraped);
        const { score: competitionScore, note: compNote } = calculateCompetitionScore(scraped, pr);
        const { score: trendScore, note: trendNote } = calculateTrendScore(scraped);
        const { score: supplierScore, note: supNote } = calculateSupplierScore(sr);
        const { score: regulatoryScore, note: regNote } = calculateRegulatoryScore(rr);
        
        const { score: riskScore, note: riskNote } = calculateRiskScore(
          regulatoryScore, 
          pr, 
          data.validation_status, 
          pr?.research_confidence || "low"
        );
        
        const { score: profitScore, note: profitNote } = calculateProfitScore(scraped, sr);
        
        const opportunityScore = calculateOpportunityScore(
          demandScore, trendScore, profitScore, supplierScore, regulatoryScore, competitionScore, riskScore
        );
        
        const aiScore = calculateAiScore(
          opportunityScore, demandScore, trendScore, profitScore, supplierScore, regulatoryScore, riskScore
        );

        const confidenceScore = calculateConfidenceScore(scraped, pr, sr, rr);
        
        const recommendation = generateRecommendation(aiScore, riskScore, regulatoryScore, confidenceScore);
        
        // Track stats
        stats.scored++;
        if (recommendation === "source_now") stats.source_now++;
        else if (recommendation === "watch") stats.watch++;
        else if (recommendation === "research_more") stats.research_more++;
        else if (recommendation === "avoid") stats.avoid++;

        const scoringNotes = [
          demandNote, compNote, trendNote, supNote, regNote, riskNote, profitNote
        ].filter(n => n && !n.includes("No") && !n.includes("Missing"));

        scoreBatch.push({
          cleaned_product_id: data.id,
          scraped_product_id: data.scraped_product_id,
          internal_product_id: data.internal_product_id,
          opportunity_score: opportunityScore,
          profit_score: profitScore,
          demand_score: demandScore,
          competition_score: competitionScore,
          supplier_score: supplierScore,
          risk_score: riskScore,
          regulatory_score: regulatoryScore,
          launch_difficulty_score: pr?.launch_difficulty === 'high' ? 85 : pr?.launch_difficulty === 'medium' ? 55 : 25,
          trend_score: trendScore,
          ai_score: aiScore,
          confidence_score: confidenceScore,
          final_recommendation: recommendation,
          scoring_notes: scoringNotes,
          score_breakdown: {
            demand: { score: demandScore, note: demandNote },
            competition: { score: competitionScore, note: compNote },
            trend: { score: trendScore, note: trendNote },
            supplier: { score: supplierScore, note: supNote },
            regulatory: { score: regulatoryScore, note: regNote },
            risk: { score: riskScore, note: riskNote },
            profit: { score: profitScore, note: profitNote }
          }
        });

      } catch (err) {
        console.error(`Failed to score product ${data.id}:`, err);
        stats.failed++;
      }
    }

    if (scoreBatch.length > 0) {
      await saveProductScore(scoreBatch);
    }

    await logScorerRun(runId, {
      status: stats.failed > 0 ? "partial" : "success",
      requested_limit: limit,
      products_found: toProcess.length,
      products_scored: stats.scored,
      source_now_count: stats.source_now,
      watch_count: stats.watch,
      research_more_count: stats.research_more,
      avoid_count: stats.avoid,
      products_failed: stats.failed,
    });

    return { 
      success: true, 
      processed: toProcess.length,
      ...stats
    };

  } catch (error: any) {
    if (runId) {
      await logScorerRun(runId, {
        status: "failed",
        requested_limit: limit,
        products_found: 0,
        products_scored: 0,
        source_now_count: 0,
        watch_count: 0,
        research_more_count: 0,
        avoid_count: 0,
        products_failed: 0,
        error_message: error.message
      });
    }
    throw error;
  }
}

async function logEmptyRun(runId: string, limit: number) {
  await logScorerRun(runId, {
    status: "success",
    requested_limit: limit,
    products_found: 0,
    products_scored: 0,
    source_now_count: 0,
    watch_count: 0,
    research_more_count: 0,
    avoid_count: 0,
    products_failed: 0,
  });
}
