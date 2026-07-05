import { ShopeeScraper } from "./platforms/shopee/shopeeScraper";
import { LazadaScraper } from "./platforms/lazada/lazadaScraper";
import { TiktokScraper } from "./platforms/tiktok/tiktokScraper";
import { SupabaseWriter, ScraperRunResult } from "./core/supabaseWriter";
import * as dotenv from "dotenv";
import path from "path";

// Load local env if running directly from CLI
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function runPlatform(platformId: string, isDryRun: boolean) {
  const started_at = new Date();
  let scraper: any;
  let platformName = "";

  if (platformId === "shopee") {
    scraper = new ShopeeScraper();
    platformName = "Shopee";
  } else if (platformId === "lazada") {
    scraper = new LazadaScraper();
    platformName = "Lazada";
  } else if (platformId === "tiktok") {
    scraper = new TiktokScraper();
    platformName = "TikTok Shop";
  } else {
    console.error(`Unknown platform: ${platformId}`);
    return;
  }

  const writer = new SupabaseWriter(platformName, isDryRun);
  let status = "success";
  let errors: string[] = [];
  let savedCount = 0;
  let candidatesCount = 0;

  try {
    const results = await scraper.run();
    candidatesCount = results.length;
    
    if (results.length > 0) {
      savedCount = await writer.saveProducts(results);
    } else {
      status = "no_data";
      errors.push("No products were extracted. Possible captcha/login block.");
    }
  } catch (err: any) {
    status = "failed";
    errors.push(err.message || String(err));
    console.error(`Error running ${platformName} scraper:`, err);
  } finally {
    const finished_at = new Date();
    
    const runRecord: ScraperRunResult = {
      platform: platformName,
      status,
      total_candidates_found: candidatesCount,
      total_products_saved: savedCount,
      errors,
      started_at,
      finished_at
    };

    await writer.saveRunRecord(runRecord);
    console.log(`\n--- ${platformName} Run Summary ---`);
    console.log(`Status: ${status}`);
    console.log(`Candidates Found: ${candidatesCount}`);
    console.log(`Products Saved: ${savedCount}`);
    console.log(`Duration: ${(finished_at.getTime() - started_at.getTime()) / 1000}s`);
    if (errors.length) console.log("Errors:", errors);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  
  // Example command: ts-node scraperRunner.ts --platform shopee --dry-run
  const platformArgIndex = args.indexOf("--platform");
  let targetPlatform = "all";
  
  if (platformArgIndex !== -1 && args[platformArgIndex + 1]) {
    targetPlatform = args[platformArgIndex + 1].toLowerCase();
  } else if (args[0] && !args[0].startsWith("--")) {
    targetPlatform = args[0].toLowerCase();
  }

  console.log(`Starting Scraping Engine... Target: ${targetPlatform} | Dry Run: ${isDryRun}`);

  if (targetPlatform === "all") {
    // Run sequentially to minimize resource usage
    // await runPlatform("shopee", isDryRun); // Temporarily disabled per user request
    await runPlatform("lazada", isDryRun);
    await runPlatform("tiktok", isDryRun);
  } else {
    await runPlatform(targetPlatform, isDryRun);
  }

  console.log("\nScraping Engine Execution Completed.");
  process.exit(0);
}

main();
