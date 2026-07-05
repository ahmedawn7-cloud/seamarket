import { normalizePlatform, cleanPrice, cleanSales, standardizeCategory } from "./core/dataNormalizer";
import { enrichProduct } from "./core/enrichment";
import { deduplicateCleanProducts, CleanProductCandidate } from "./core/deduplicator";
import { SupabaseCleanerWriter } from "./core/supabaseCleanerWriter";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function runCleaner() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const isRecent = args.includes("--recent");
  
  let targetPlatform: string | undefined;
  const platformArgIndex = args.indexOf("--platform");
  if (platformArgIndex !== -1 && args[platformArgIndex + 1]) {
    targetPlatform = args[platformArgIndex + 1];
  }

  console.log(`\n=== Starting Product Cleaner Bot ===`);
  console.log(`Dry Run: ${isDryRun}`);
  console.log(`Target Platform: ${targetPlatform || "All"}`);
  console.log(`Mode: ${isRecent ? "Recent Only" : "All Pending"}`);

  const writer = new SupabaseCleanerWriter(isDryRun);
  
  // 1. Fetch raw candidates
  const limit = isDryRun ? 5 : 100; // Small batch for dry run
  const rawProducts = await writer.getUncleanedProducts(limit, isRecent, targetPlatform);
  
  if (rawProducts.length === 0) {
    console.log("No new products found to clean.");
    await writer.saveRunRecord("success", 0, 0, 0, []);
    return;
  }

  console.log(`Found ${rawProducts.length} products to clean and enrich.`);

  const cleanCandidates: CleanProductCandidate[] = [];
  const errors: string[] = [];

  // 2. Normalize & Enrich
  for (let i = 0; i < rawProducts.length; i++) {
    const raw = rawProducts[i];
    console.log(`Processing [${i + 1}/${rawProducts.length}]: ${raw.product_name.substring(0, 30)}...`);

    try {
      // Basic normalization
      const normPlatform = normalizePlatform(raw.platform);
      const normPrice = cleanPrice(raw.price_rm);
      const normSales = cleanSales(raw.sales);
      const normCategory = standardizeCategory(raw.category);

      // AI Enrichment
      const aiResult = await enrichProduct(raw.product_name, normPrice, normCategory);

      cleanCandidates.push({
        scraped_product_id: raw.id,
        product_url: raw.product_url,
        image_url: raw.image_url,
        product_name: raw.product_name,
        platform: normPlatform,
        price_rm: normPrice,
        sales: normSales,
        rating_score: raw.rating_score,
        review_count: raw.review_count,
        scrape_date: new Date(raw.scrape_date || raw.created_at),
        original_product_name: raw.product_name,
        normalized_category: normCategory,
        // AI Enrichment Results
        clean_name_ai: aiResult.clean_name_ai,
        demand_score: aiResult.demand_score,
        competition_score: aiResult.competition_score,
        trend_score: aiResult.trend_score,
        opportunity_score: aiResult.opportunity_score,
        risk_score: aiResult.risk_score,
        margin_signal: aiResult.margin_signal,
        supplier_readiness_score: aiResult.supplier_readiness_score,
        product_verdict: aiResult.product_verdict,
        ai_reasoning_summary: aiResult.ai_reasoning_summary,
        next_best_action: aiResult.next_best_action,
        confidence_score: 90, // Baseline heuristic confidence
        cleaned_at: new Date()
      });
    } catch (e: any) {
      console.error(`Failed to process product ${raw.id}:`, e);
      errors.push(`ID ${raw.id}: ${e.message}`);
    }
  }

  // 3. Deduplicate
  console.log("Running deduplication...");
  const deduplicated = deduplicateCleanProducts(cleanCandidates);
  const duplicatesCount = deduplicated.filter(p => p.is_duplicate).length;
  console.log(`Identified ${duplicatesCount} duplicates among ${deduplicated.length} total processed.`);

  // 4. Save results
  const savedCount = await writer.saveCleanedProducts(deduplicated);

  // 5. Record Run
  await writer.saveRunRecord(
    errors.length === 0 ? "success" : "partial_success",
    rawProducts.length,
    savedCount,
    duplicatesCount,
    errors
  );

  console.log(`\n=== Cleaner Bot Run Complete ===`);
  console.log(`Found: ${rawProducts.length} | Cleaned & Saved: ${savedCount} | Duplicates Flagged: ${duplicatesCount}`);
  if (errors.length) console.log(`Errors: ${errors.length}`);
}

runCleaner().catch(err => {
  console.error("Critical failure in Cleaner Runner:", err);
  process.exit(1);
});
