import { runResearcher } from "../lib/researcher/engine";
import { validateResearcherEnvironment } from "../lib/researcher/config";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables for the script
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function executeResearcherScript() {
  console.log("Starting Research Bot...");
  
  try {
    validateResearcherEnvironment();

    // Default to processing 50 at a time when run from CLI, or accept an argument
    const limitArg = process.argv[2];
    const limit = limitArg ? parseInt(limitArg, 10) : 50;
    
    console.log(`Processing batch of up to ${limit} records...`);
    const result = await runResearcher(limit);
    
    if (result.success) {
      console.log(`✅ Researcher run completed successfully.`);
      console.log(`Processed: ${result.processed} | Researched: ${result.researched} | Supplier Recs: ${result.supplier_records} | Regulatory Recs: ${result.regulatory_records} | Failed: ${result.failed}`);
    } else {
      console.error(`❌ Researcher run returned unsuccessful status.`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Critical error during researcher run:", error);
    process.exit(1);
  }
}

executeResearcherScript();
