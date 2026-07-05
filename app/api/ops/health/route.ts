import { NextResponse } from "next/server";
import { getServiceSupabaseClientOrError } from "@/lib/supabase/serverClient";

export const dynamic = "force-dynamic";
const TABLE_CHECK_TIMEOUT_MS = 4500;

const REQUIRED_PRODUCT_COLUMNS = [
  "Scrape_Date",
  "Product_Name",
  "Image_URL",
  "Product_URL",
  "Sales",
  "Price_RM",
  "Category",
  "Profit_Score",
  "Trend_Rank",
];

const CORE_TABLES = [
  "MYProductScout_Master",
  "scraped_products",
  "scraped_products_staging",
  "scraper_runs",
  "scraper_schedules",
  "cleaned_products",
  "cleaner_runs",
  "product_research",
  "supplier_research",
  "regulatory_research",
  "researcher_runs",
  "product_scores",
  "scorer_runs",
  "chat_conversations",
  "chat_messages",
  "waitlist",
  "user_profiles",
  "user_watchlist",
  "research_notes",
  "research_tasks",
  "community_posts",
  "community_comments",
  "community_post_reactions",
  "user_saved_community_posts",
  "community_follows",
  "community_topics",
  "community_events",
  "community_product_recommendations",
  "community_contributor_profiles",
  "community_contribution_activity_logs",
] as const;

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SCRAPER_SECRET",
  "CLEANER_SECRET",
  "RESEARCHER_SECRET",
  "SCORER_SECRET",
] as const;

const BOT_REQUIREMENTS = {
  scraper: ["scraped_products", "scraped_products_staging", "scraper_runs", "scraper_schedules"],
  cleaner: ["scraped_products", "cleaned_products", "cleaner_runs"],
  researcher: ["cleaned_products", "product_research", "supplier_research", "regulatory_research", "researcher_runs"],
  scorer: ["cleaned_products", "product_research", "supplier_research", "regulatory_research", "product_scores", "scorer_runs"],
  chat: ["chat_conversations", "chat_messages"],
} as const;

const REQUIRED_COLUMNS_BY_TABLE: Record<string, string[]> = {
  scraper_runs: ["id", "bot_name", "platform", "status", "items_requested", "metadata", "started_at", "finished_at"],
  scraped_products_staging: ["id", "scrape_date", "platform", "product_name", "product_url", "staging_status"],
  scraped_products: ["id", "scrape_date", "platform", "product_name", "product_url"],
  cleaned_products: ["id", "scraped_product_id", "internal_product_id", "clean_name_ai", "normalized_category"],
  product_research: ["id", "cleaned_product_id", "internal_product_id", "product_summary"],
  supplier_research: ["id", "cleaned_product_id", "supplier_type", "supplier_url"],
  regulatory_research: ["id", "cleaned_product_id", "sirim_risk", "kkm_risk", "npra_risk"],
  product_scores: ["id", "cleaned_product_id", "ai_score", "final_recommendation"],
  chat_conversations: ["id", "user_id", "title"],
  chat_messages: ["id", "conversation_id", "role", "content"],
  research_notes: ["id", "user_id", "title", "content"],
  research_tasks: ["id", "user_id", "type", "prompt", "status"],
  community_comments: ["id", "post_id", "user_id", "body"],
  community_post_reactions: ["id", "post_id", "user_id", "reaction"],
  user_saved_community_posts: ["id", "user_id", "post_id", "snapshot"],
  community_follows: ["id", "follower_id", "following_id"],
  community_product_recommendations: ["id", "user_id", "product_name", "platform_found_on", "status", "points_awarded"],
  community_contributor_profiles: ["id", "user_id", "total_points", "submitted_count", "approved_count", "current_rank"],
  community_contribution_activity_logs: ["id", "user_id", "recommendation_id", "action", "points_change"],
};

export async function GET() {
  const startedAt = Date.now();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const { supabase, error: configError } = getServiceSupabaseClientOrError();

  const env = {
    supabaseUrl: Boolean(supabaseUrl),
    supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
    supabaseServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    scraperSecret: Boolean(process.env.SCRAPER_SECRET?.trim()),
    cleanerSecret: Boolean(process.env.CLEANER_SECRET?.trim()),
    researcherSecret: Boolean(process.env.RESEARCHER_SECRET?.trim()),
    scorerSecret: Boolean(process.env.SCORER_SECRET?.trim()),
    siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
    aiProvider: process.env.AI_PROVIDER?.trim() || "mock",
    groqApiKey: Boolean(process.env.GROQ_API_KEY?.trim()),
    groqModel: process.env.GROQ_MODEL?.trim() || "not set",
    telegramBotToken: Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()),
  };

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        generatedAt: new Date().toISOString(),
        site: getSiteHealth(startedAt),
        env,
        database: {
          connected: false,
          tables: [],
          error: configError,
        },
        missingEnvironmentVariables: getMissingEnv(),
        botReadiness: getBotReadiness([], env),
        scraper: getScraperReadiness([], env),
      },
      { status: 503 },
    );
  }

  const tableChecks = await Promise.all(CORE_TABLES.map((table) => withTimeout(checkTable(supabase, table), table, TABLE_CHECK_TIMEOUT_MS)));
  const productTable = tableChecks.find((table) => table.table === "MYProductScout_Master");
  const productColumns = productTable?.columns ?? [];
  const missingProductColumns = REQUIRED_PRODUCT_COLUMNS.filter((column) => !productColumns.includes(column));
  const databaseConnected = tableChecks.some((table) => table.reachable);
  const criticalFailures = tableChecks.filter((table) => table.required && !table.reachable);
  const missingEnvironmentVariables = getMissingEnv();
  const botReadiness = getBotReadiness(tableChecks, env);
  const warnings = [
    ...(!env.supabaseServiceRoleKey ? ["Service role key is missing. Server diagnostics may be limited by RLS."] : []),
    ...(missingProductColumns.length > 0
      ? [`Product table is missing expected columns: ${missingProductColumns.join(", ")}`]
      : []),
    ...(env.aiProvider === "groq" && !env.groqApiKey ? ["AI_PROVIDER is groq but GROQ_API_KEY is missing."] : []),
    ...(!env.telegramBotToken ? ["Telegram bot token is missing. Telegram alerts/webhook will not work."] : []),
    ...(missingEnvironmentVariables.length ? [`Missing required environment variables: ${missingEnvironmentVariables.join(", ")}`] : []),
  ];

  return NextResponse.json({
    ok: databaseConnected && criticalFailures.length === 0 && missingEnvironmentVariables.length === 0 && botReadiness.every((bot) => bot.ready),
    generatedAt: new Date().toISOString(),
    site: getSiteHealth(startedAt),
    env,
    database: {
      connected: databaseConnected,
      tables: tableChecks,
      productSchema: {
        requiredColumns: REQUIRED_PRODUCT_COLUMNS,
        missingColumns: missingProductColumns,
      },
      warnings,
    },
    missingEnvironmentVariables,
    botReadiness,
    scraper: getScraperReadiness(tableChecks, env),
  });
}

async function checkTable(supabase: any, table: string) {
  const isOptional = table.startsWith("community_") || table.startsWith("research_") || table === "user_saved_community_posts" || table === "waitlist";
  const required = !isOptional;
  const startedAt = Date.now();
  const expectedColumns = REQUIRED_COLUMNS_BY_TABLE[table] || [];
  const selectColumns = expectedColumns.length ? expectedColumns.join(",") : "*";
  const { data, count, error } = await supabase.from(table).select(selectColumns, { count: "exact" }).limit(1);

  return {
    table,
    required,
    reachable: !error,
    count: count ?? 0,
    sampleRows: data?.length ?? 0,
    columns: data?.[0] ? Object.keys(data[0]) : expectedColumns,
    expectedColumns,
    missingColumns: error && expectedColumns.length ? expectedColumns : [],
    latencyMs: Date.now() - startedAt,
    error: error
      ? {
          code: error.code,
          message: error.message,
          details: error.details,
        }
      : null,
  };
}

function getMissingEnv() {
  return REQUIRED_ENV.filter((key) => !process.env[key]?.trim());
}

async function withTimeout<T>(promise: Promise<T>, table: string, timeoutMs: number): Promise<T | ReturnType<typeof timeoutTableResult>> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<ReturnType<typeof timeoutTableResult>>((resolve) => {
        timeoutId = setTimeout(() => resolve(timeoutTableResult(table, timeoutMs)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function timeoutTableResult(table: string, timeoutMs: number) {
  return {
    table,
    required: table === "MYProductScout_Master",
    reachable: false,
    count: 0,
    sampleRows: 0,
    columns: [],
    latencyMs: timeoutMs,
    error: {
      code: "OPS_TIMEOUT",
      message: `Table check timed out after ${timeoutMs}ms.`,
      details: "The dashboard continued loading with degraded diagnostics.",
    },
  };
}

function getSiteHealth(startedAt: number) {
  return {
    runtime: "Next.js API route",
    uptimeSeconds: Math.round(process.uptime()),
    latencyMs: Date.now() - startedAt,
    nodeEnv: process.env.NODE_ENV || "unknown",
    region: process.env.VERCEL_REGION || "local",
    deployment: process.env.VERCEL_URL || "local",
  };
}

function getScraperReadiness(tables: any[], env: any) {
  const master = tables.find((table) => table.table === "MYProductScout_Master");
  const hasProductTable = Boolean(master?.reachable);
  const hasProductRows = Number(master?.count || 0) > 0;
  const hasMinimumColumns = REQUIRED_PRODUCT_COLUMNS.every((column) => master?.columns?.includes(column));

  return {
    status: hasProductTable && hasProductRows && hasMinimumColumns ? "ready_for_planning" : "setup_required",
    bots: [
      {
        name: "Bot Scraper",
        status: getSingleBotStatus("scraper", tables, env).status,
        purpose: "Collect weekly marketplace product signals into a staging table before review.",
      },
      {
        name: "Bot Cleaner",
        status: getSingleBotStatus("cleaner", tables, env).status,
        purpose: "Normalize names, categories, compliance flags, and supplier fields.",
      },
      {
        name: "Research Bot",
        status: getSingleBotStatus("researcher", tables, env).status,
        purpose: "Generate product analysis, rankings, supplier checks, and monitoring notes.",
      },
    ],
    requirements: {
      productTableReachable: hasProductTable,
      productRowsAvailable: hasProductRows,
      productSchemaReady: hasMinimumColumns,
      aiProviderConfigured: env.aiProvider === "groq" ? env.groqApiKey : true,
    },
  };
}

function getBotReadiness(tables: any[], env: any) {
  return [
    getSingleBotStatus("scraper", tables, env),
    getSingleBotStatus("cleaner", tables, env),
    getSingleBotStatus("researcher", tables, env),
    getSingleBotStatus("scorer", tables, env),
    getSingleBotStatus("chat", tables, env),
  ];
}

function getSingleBotStatus(bot: keyof typeof BOT_REQUIREMENTS, tables: any[], env: any) {
  const tableNames = BOT_REQUIREMENTS[bot];
  const missingTables = tableNames.filter((tableName) => !tables.find((table) => table.table === tableName && table.reachable));
  const missingEnv =
    bot === "scraper"
      ? (!env.scraperSecret ? ["SCRAPER_SECRET"] : [])
      : bot === "cleaner"
        ? (!env.cleanerSecret ? ["CLEANER_SECRET"] : [])
        : bot === "researcher"
          ? (!env.researcherSecret ? ["RESEARCHER_SECRET"] : [])
          : bot === "scorer"
            ? (!env.scorerSecret ? ["SCORER_SECRET"] : [])
            : [];
  const demoAdapterOnly = bot === "scraper";
  const ready = missingTables.length === 0 && missingEnv.length === 0 && !demoAdapterOnly;

  return {
    bot,
    ready,
    status: missingEnv.length
      ? "missing_environment_variable"
      : missingTables.length
        ? "missing_table_or_column"
        : demoAdapterOnly
          ? "demo_adapter_only"
          : "ready",
    missingTables,
    missingEnv,
    demoAdapterOnly,
    message: demoAdapterOnly ? "Demo adapter data — real marketplace connection not active yet." : undefined,
  };
}

