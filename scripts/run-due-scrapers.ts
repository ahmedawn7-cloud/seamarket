import { runDueSchedules } from "../lib/scraper/core/scheduler";
import { validateEnvironment } from "../lib/scraper/config/scraperConfig";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables for the script
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function checkAndRunDueScrapers() {
  console.log("Checking for due scraper schedules...");
  
  try {
    validateEnvironment();

    const results = await runDueSchedules();
    
    if (results.length === 0) {
      console.log("No schedules are currently due.");
    } else {
      console.log(`Executed ${results.length} due schedules.`);
      console.log("Results:", JSON.stringify(results, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error("Critical error during schedule execution:", error);
    process.exit(1);
  }
}

checkAndRunDueScrapers();
