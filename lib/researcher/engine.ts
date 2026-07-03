import { createClient } from "@supabase/supabase-js";
import { ProductResearch, SupplierResearch, RegulatoryResearch } from "./types";
import { createResearcherRunLog, logResearcherRun } from "./researcherLogger";
import { runRuleBasedResearch } from "./providers/ruleBasedResearchProvider";
import { saveResearch } from "./saveResearch";

export async function runResearcher(limit: number = 50) {
  let runId = "";
  try {
    runId = await createResearcherRunLog(limit);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      return { success: true, processed: 0 };
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
      return { success: true, processed: 0 };
    }

    const prBatch: Partial<ProductResearch>[] = [];
    const srBatch: Partial<SupplierResearch>[] = [];
    const rrBatch: Partial<RegulatoryResearch>[] = [];
    
    let researchedCount = 0;
    let failedCount = 0;

    for (const cleanedProduct of toProcess) {
      try {
        // Run modular research pipeline
        const { productResearch, suppliers, regulatoryResearch } = runRuleBasedResearch(cleanedProduct);
        
        prBatch.push(productResearch);
        suppliers.forEach((s: any) => srBatch.push(s));
        rrBatch.push(regulatoryResearch);
        
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
