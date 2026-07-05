import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const scraperBots = [
  {
    id: "marketplace-scraper",
    name: "Bot Scraper",
    status: "demo_adapter_only",
    cadence: "Weekly",
    targetPlatforms: ["Shopee", "Lazada", "TikTok Shop"],
    output: "scraped_products_staging",
    nextMilestone: "Demo adapter data — real marketplace connection not active yet.",
  },
  {
    id: "data-cleaner",
    name: "Bot Cleaner",
    status: process.env.CLEANER_SECRET && process.env.SUPABASE_SERVICE_ROLE_KEY ? "ready" : "missing_environment_variable",
    cadence: "After every scrape",
    targetPlatforms: ["Internal dataset"],
    output: "MYProductScout_Master",
    nextMilestone: "Normalize product names, categories, compliance flags, and supplier fields.",
  },
  {
    id: "research-ranker",
    name: "Research Bot",
    status: process.env.RESEARCHER_SECRET && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? process.env.AI_PROVIDER === "groq" && process.env.GROQ_API_KEY
        ? "ai_ready"
        : "demo_adapter_only"
      : "missing_environment_variable",
    cadence: "Weekly plus on-demand",
    targetPlatforms: ["Internal dataset", "public product research"],
    output: "product_research_scores",
    nextMilestone: "Connect product rows to AI scoring and research notes.",
  },
];

export async function GET() {
  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    environment: {
      aiProvider: process.env.AI_PROVIDER || "mock",
      hasGroqKey: Boolean(process.env.GROQ_API_KEY),
      hasSupabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasScraperSecret: Boolean(process.env.SCRAPER_SECRET),
      hasCleanerSecret: Boolean(process.env.CLEANER_SECRET),
      hasResearcherSecret: Boolean(process.env.RESEARCHER_SECRET),
      hasScorerSecret: Boolean(process.env.SCORER_SECRET),
      scraperAdapter: "demo_adapter_only",
    },
    scrapers: scraperBots,
    recommendedTables: [
      "scraper_runs",
      "scraper_run_logs",
      "scraped_products_staging",
      "product_research_scores",
    ],
  });
}
