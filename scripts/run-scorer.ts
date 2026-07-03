import { runScorer } from "../lib/scorer/engine";
import { validateScorerEnvironment } from "../lib/scorer/config";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function executeScorerScript() {
  console.log("Starting Scoring Bot...");
  
  try {
    validateScorerEnvironment();

    const limitArg = process.argv[2];
    const limit = limitArg ? parseInt(limitArg, 10) : 50;
    
    console.log(`Processing batch of up to ${limit} records...`);
    const result = await runScorer(limit);
    
    if (result.success) {
      console.log(`✅ Scorer run completed successfully.`);
      console.log(`Processed: ${result.processed} | Scored: ${result.scored} | Source Now: ${result.source_now} | Avoid: ${result.avoid} | Failed: ${result.failed}`);
    } else {
      console.error(`❌ Scorer run returned unsuccessful status.`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Critical error during scorer run:", error);
    process.exit(1);
  }
}

executeScorerScript();
