import { ScraperController } from "../lib/scraper/core/scraperController";
import { validateEnvironment } from "../lib/scraper/config/scraperConfig";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables for the script
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function runWeeklyScraper() {
  console.log("Starting weekly scraper run...");
  
  try {
    validateEnvironment();

    const controller = new ScraperController();
    
    // We can run platforms sequentially or in parallel
    const platforms = ["Shopee", "Lazada", "TikTok Shop"];
    
    for (const platform of platforms) {
      console.log(`\n--- Starting scraping for ${platform} ---`);
      // Use default limit of 100 as per requirements
      const result = await controller.run(platform, 100);
      
      if (result.success) {
        console.log(`✅ ${platform} completed successfully.`);
        console.log(`Found: ${result.found} | Saved: ${result.saved} | Failed: ${result.failed}`);
      } else {
        console.error(`❌ ${platform} failed:`, result.error);
      }
    }

    console.log("\nWeekly scraper run completed successfully.");
    process.exit(0);

  } catch (error) {
    console.error("Critical error during weekly scraper run:", error);
    process.exit(1);
  }
}

runWeeklyScraper();
