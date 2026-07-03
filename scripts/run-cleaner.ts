import { runCleaner } from "../lib/cleaner/engine";
import { validateCleanerEnvironment } from "../lib/cleaner/config";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables for the script
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function executeCleanerScript() {
  console.log("Starting Cleaner Bot...");
  
  try {
    validateCleanerEnvironment();

    // Default to processing 100 at a time when run from CLI, or accept an argument
    const limitArg = process.argv[2];
    const limit = limitArg ? parseInt(limitArg, 10) : 100;
    
    console.log(`Processing batch of up to ${limit} records...`);
    const result = await runCleaner(limit);
    
    if (result.success) {
      console.log(`✅ Cleaner run completed successfully.`);
      console.log(`Found: ${result.processed} | Cleaned: ${result.cleaned} | Duplicates: ${result.duplicates} | Invalid: ${result.invalid} | Failed: ${result.failed}`);
    } else {
      console.error(`❌ Cleaner run returned unsuccessful status.`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Critical error during cleaner run:", error);
    process.exit(1);
  }
}

executeCleanerScript();
