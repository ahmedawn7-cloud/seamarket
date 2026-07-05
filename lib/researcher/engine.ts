import { getServiceSupabaseClient } from "@/lib/supabase/serviceRoleClient";
import { ProductResearch, SupplierResearch, RegulatoryResearch } from "./types";
import { createResearcherRunLog, logResearcherRun } from "./researcherLogger";
import { getProductInsight } from "./ai/productInsight";
import { getSupplierEstimation } from "./ai/supplierEstimation";
import { getRegulatoryAnalysis } from "./ai/regulatoryAnalysis";
import { calculateResearchConfidence } from "./researchConfidence";
import { buildSource } from "./sourceBuilder";
import { saveResearch } from "./saveResearch";

export async function runResearcher(limit: number = 50) {
  let runId = "";
  try {
    runId = await createResearcherRunLog(limit);

    const supabase = getServiceSupabaseClient();

    // Fetch valid cleaned products that haven't been researched yet
    const { data: cleanedData, error: cleanedError } = await supabase
      .from("cleaned_products")
      .select("*")
      .neq("validation_status", "invalid")
      .order("cleaned_at", { ascending: false })
      .limit(Math.min(limit * 2, 1000));

    if (cleanedError) throw cleanedError;

    if (!cleanedData || cleanedData.length === 0) {
      await logResearcherRun(runId, {
        status: "success",
        requested_limit: limit,
        products_found: 0,
        products_researched: 0,
        supplier_records_created: 0,
        regulatory_records_created: 0,
        products_skipped: 0,
        products_failed: 0,
      });
      return { success: true, processed: 0, researched: 0, supplier_records: 0, regulatory_records: 0, failed: 0 };
    }

    // Check which ones are already researched
    const cleanedIds = cleanedData.map(p => p.id);
    const { data: alreadyResearched } = await supabase
      .from("product_research")
      .select("cleaned_product_id")
      .in("cleaned_product_id", cleanedIds);

    const alreadyResearchedIds = new Set(alreadyResearched?.map(r => r.cleaned_product_id) || []);
    
    const toProcess = cleanedData
      .filter(p => !alreadyResearchedIds.has(p.id))
      .slice(0, limit);

    if (toProcess.length === 0) {
      await logResearcherRun(runId, {
        status: "success",
        requested_limit: limit,
        products_found: 0,
        products_researched: 0,
        supplier_records_created: 0,
        regulatory_records_created: 0,
        products_skipped: cleanedData.length,
        products_failed: 0,
      });
      return { success: true, processed: 0, researched: 0, supplier_records: 0, regulatory_records: 0, failed: 0 };
    }

    const prBatch: Partial<ProductResearch>[] = [];
    const srBatch: Partial<SupplierResearch>[] = [];
    const rrBatch: Partial<RegulatoryResearch>[] = [];
    
    let researchedCount = 0;
    let failedCount = 0;

    for (const cleanedProduct of toProcess) {
      try {
        const name = cleanedProduct.clean_name_ai || cleanedProduct.product_name;
        const cat = cleanedProduct.normalized_category || cleanedProduct.category;
        const price = cleanedProduct.price_rm;

        // Run AI research modules in parallel
        const [productInsight, supplierEstimation, regulatoryAnalysis] = await Promise.all([
          getProductInsight(name, cat),
          getSupplierEstimation(name, price),
          getRegulatoryAnalysis(name, cat)
        ]);

        const baseConfidence = cleanedProduct.confidence_score || 50;
        const confidence = calculateResearchConfidence(baseConfidence);
        const source = buildSource("aiResearchProvider", "ai_intelligence");

        const productResearch: Partial<ProductResearch> = {
          cleaned_product_id: cleanedProduct.id,
          internal_product_id: cleanedProduct.internal_product_id,
          research_status: 'completed',
          research_confidence: confidence,
          product_summary: productInsight.product_summary,
          target_customer: productInsight.target_customer,
          demand_signals: productInsight.demand_signals,
          competition_signals: productInsight.competition_signals,
          product_risks: productInsight.product_risks,
          shipping_risks: ["Standard"], // Using standard default
          launch_difficulty: productInsight.launch_difficulty.toLowerCase() as any,
          marketing_angles: productInsight.marketing_angles,
          suggested_keywords: productInsight.suggested_keywords,
          suggested_titles: { default: name },
          suggested_listing_bullets: [],
          regulatory_notes: regulatoryAnalysis.compliance_notes,
          research_sources: [source]
        };

        const sr: Partial<SupplierResearch> = {
          cleaned_product_id: cleanedProduct.id,
          internal_product_id: cleanedProduct.internal_product_id,
          supplier_type: supplierEstimation.supplier_type,
          supplier_name: null,
          supplier_url: null,
          supplier_country: null,
          supplier_shipping_location: null,
          estimated_cogs_rm: supplierEstimation.estimated_cogs_rm,
          estimated_moq: supplierEstimation.estimated_moq,
          estimated_lead_time_days: supplierEstimation.estimated_lead_time_days,
          supplier_confidence: confidence,
          supplier_notes: null,
          source: "aiResearchProvider",
          raw_payload: {
            sourcing_difficulty: supplierEstimation.sourcing_difficulty,
            supplier_questions_to_ask: supplierEstimation.supplier_questions_to_ask,
            supplier_search_urls: supplierEstimation.supplier_search_urls
          }
        };

        const rr: Partial<RegulatoryResearch> = {
          cleaned_product_id: cleanedProduct.id,
          internal_product_id: cleanedProduct.internal_product_id,
          country: "Malaysia",
          category: cat,
          possible_regulatory_flags: regulatoryAnalysis.possible_regulatory_flags,
          sirim_risk: regulatoryAnalysis.sirim_risk.toLowerCase() as any,
          kkm_risk: regulatoryAnalysis.kkm_risk.toLowerCase() as any,
          npra_risk: regulatoryAnalysis.npra_risk.toLowerCase() as any,
          customs_risk: regulatoryAnalysis.customs_risk.toLowerCase() as any,
          age_restriction_risk: regulatoryAnalysis.age_restriction_risk.toLowerCase() as any,
          restricted_product_risk: regulatoryAnalysis.restricted_product_risk.toLowerCase() as any,
          compliance_notes: regulatoryAnalysis.compliance_notes,
          official_sources: [source],
          regulatory_confidence: confidence
        };
        
        prBatch.push(productResearch);
        srBatch.push(sr);
        rrBatch.push(rr);
        
        researchedCount++;
      } catch (err) {
        console.error(`Failed to research product ${cleanedProduct.id}:`, err);
        failedCount++;
      }
    }

    if (prBatch.length > 0) {
      await saveResearch(prBatch, srBatch, rrBatch);
    }

    await logResearcherRun(runId, {
      status: failedCount > 0 ? "partial" : "success",
      requested_limit: limit,
      products_found: toProcess.length,
      products_researched: researchedCount,
      supplier_records_created: srBatch.length,
      regulatory_records_created: rrBatch.length,
      products_skipped: 0,
      products_failed: failedCount,
    });

    return { 
      success: true, 
      processed: toProcess.length,
      researched: researchedCount,
      supplier_records: srBatch.length,
      regulatory_records: rrBatch.length,
      failed: failedCount
    };

  } catch (error: any) {
    if (runId) {
      await logResearcherRun(runId, {
        status: "failed",
        requested_limit: limit,
        products_found: 0,
        products_researched: 0,
        supplier_records_created: 0,
        regulatory_records_created: 0,
        products_skipped: 0,
        products_failed: 0,
        error_message: error.message
      });
    }
    throw error;
  }
}
