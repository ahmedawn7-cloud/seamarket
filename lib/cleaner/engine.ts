import { createClient } from "@supabase/supabase-js";
import { ScrapedProduct, CleanedProduct } from "./types";
import { cleanProductName } from "./nameCleaner";
import { extractKeywords } from "./keywordExtractor";
import { normalizeBrand } from "./brandNormalizer";
import { normalizeCategory } from "./categoryNormalizer";
import { detectLanguage } from "./languageDetector";
import { translateText } from "./translator";
import { detectDuplicate } from "./duplicateDetector";
import { generateImageHash } from "./imageHasher";
import { validateProduct } from "./validator";
import { generateConfidenceScore } from "./confidenceScorer";
import { saveCleanedProducts } from "./saveCleanProduct";
import { createCleanerRunLog, logCleanerRun } from "./cleanerLogger";

export async function runCleaner(limit: number = 100) {
  let runId = "";
  try {
    runId = await createCleanerRunLog(limit);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch uncleaned records. We can do an anti-join or just fetch raw and filter.
    // To do it safely in Supabase without complex raw SQL, we fetch scraped_products 
    // where ID is not in cleaned_products, using a LEFT JOIN trick or a subquery.
    // For simplicity with JS client, we fetch raw and check. In production, a Postgres View is better.
    // For now, we fetch latest scraped and filter out ones we already cleaned.
    
    // Fetch a bit more than limit in case many are already cleaned
    const { data: scrapedData, error: scrapedError } = await supabase
      .from("scraped_products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(Math.min(limit * 2, 1000));

    if (scrapedError) throw scrapedError;

    if (!scrapedData || scrapedData.length === 0) {
      await logCleanerRun(runId, {
        status: "success",
        requested_limit: limit,
        products_found: 0,
        products_cleaned: 0,
        products_duplicate: 0,
        products_invalid: 0,
        products_failed: 0,
      });
      return { success: true, processed: 0 };
    }

    // Check which ones are already cleaned
    const scrapedIds = scrapedData.map(p => p.id);
    const { data: alreadyCleaned } = await supabase
      .from("cleaned_products")
      .select("scraped_product_id")
      .in("scraped_product_id", scrapedIds);

    const alreadyCleanedIds = new Set(alreadyCleaned?.map(c => c.scraped_product_id) || []);
    
    const toProcess = scrapedData
      .filter(p => !alreadyCleanedIds.has(p.id))
      .slice(0, limit);

    if (toProcess.length === 0) {
      await logCleanerRun(runId, {
        status: "success",
        requested_limit: limit,
        products_found: 0,
        products_cleaned: 0,
        products_duplicate: 0,
        products_invalid: 0,
        products_failed: 0,
      });
      return { success: true, processed: 0 };
    }

    const cleanedBatch: CleanedProduct[] = [];
    let duplicateCount = 0;
    let invalidCount = 0;
    let failedCount = 0;

    for (const raw of toProcess as ScrapedProduct[]) {
      try {
        const cleanName = cleanProductName(raw.clean_name_ai || raw.product_name);
        const translatedName = await translateText(cleanName);
        const language = detectLanguage(cleanName);
        const keywords = extractKeywords(cleanName);
        const brand = normalizeBrand(raw.brand, cleanName);
        const category = normalizeCategory(raw.category);
        
        const partialClean: Partial<CleanedProduct> = {
          scraped_product_id: raw.id,
          platform: raw.platform,
          original_product_name: raw.product_name,
          clean_name_ai: cleanName,
          translated_name: translatedName,
          normalized_brand: brand,
          normalized_category: category,
          product_type: null, // AI product type classifier later
          language,
          keywords,
          product_url: raw.product_url,
          image_url: raw.image_url,
          image_hash: generateImageHash(raw.image_url)
        };

        const { isDuplicate, duplicateGroup } = detectDuplicate(partialClean, cleanedBatch);
        partialClean.is_duplicate = isDuplicate;
        partialClean.duplicate_group = duplicateGroup;

        if (isDuplicate) duplicateCount++;

        const { status, errors } = validateProduct(raw, partialClean);
        partialClean.validation_status = status;
        partialClean.validation_errors = errors;

        if (status === "invalid") invalidCount++;

        partialClean.confidence_score = generateConfidenceScore(raw, partialClean);

        cleanedBatch.push(partialClean as CleanedProduct);

      } catch (err) {
        console.error(`Failed to clean product ${raw.id}:`, err);
        failedCount++;
      }
    }

    if (cleanedBatch.length > 0) {
      await saveCleanedProducts(cleanedBatch);
    }

    await logCleanerRun(runId, {
      status: failedCount > 0 ? "partial" : "success",
      requested_limit: limit,
      products_found: toProcess.length,
      products_cleaned: cleanedBatch.length,
      products_duplicate: duplicateCount,
      products_invalid: invalidCount,
      products_failed: failedCount,
    });

    return { 
      success: true, 
      processed: toProcess.length,
      cleaned: cleanedBatch.length,
      duplicates: duplicateCount,
      invalid: invalidCount,
      failed: failedCount
    };

  } catch (error: any) {
    if (runId) {
      await logCleanerRun(runId, {
        status: "failed",
        requested_limit: limit,
        products_found: 0,
        products_cleaned: 0,
        products_duplicate: 0,
        products_invalid: 0,
        products_failed: 0,
        error_message: error.message
      });
    }
    throw error;
  }
}
