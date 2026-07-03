import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
  "waitlist",
  "user_profiles",
  "user_watchlist",
  "community_posts",
  "community_topics",
  "community_events",
] as const;

export async function GET() {
  const startedAt = Date.now();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const env = {
    supabaseUrl: Boolean(supabaseUrl),
    supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
    supabaseServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
    aiProvider: process.env.AI_PROVIDER?.trim() || "mock",
    groqApiKey: Boolean(process.env.GROQ_API_KEY?.trim()),
    groqModel: process.env.GROQ_MODEL?.trim() || "not set",
    telegramBotToken: Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()),
  };

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      {
        ok: false,
        generatedAt: new Date().toISOString(),
        site: getSiteHealth(startedAt),
        env,
        database: {
          connected: false,
          tables: [],
          error: "Missing Supabase URL or key.",
        },
        scraper: getScraperReadiness([], env),
      },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const tableChecks = await Promise.all(CORE_TABLES.map((table) => withTimeout(checkTable(supabase, table), table, TABLE_CHECK_TIMEOUT_MS)));
  const productTable = tableChecks.find((table) => table.table === "MYProductScout_Master");
  const productColumns = productTable?.columns ?? [];
  const missingProductColumns = REQUIRED_PRODUCT_COLUMNS.filter((column) => !productColumns.includes(column));
  const databaseConnected = tableChecks.some((table) => table.reachable);
  const criticalFailures = tableChecks.filter((table) => table.required && !table.reachable);
  const warnings = [
    ...(!env.supabaseServiceRoleKey ? ["Service role key is missing. Server diagnostics may be limited by RLS."] : []),
    ...(missingProductColumns.length > 0
      ? [`Product table is missing expected columns: ${missingProductColumns.join(", ")}`]
      : []),
    ...(env.aiProvider === "groq" && !env.groqApiKey ? ["AI_PROVIDER is groq but GROQ_API_KEY is missing."] : []),
    ...(!env.telegramBotToken ? ["Telegram bot token is missing. Telegram alerts/webhook will not work."] : []),
  ];

  return NextResponse.json({
    ok: databaseConnected && criticalFailures.length === 0,
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
    scraper: getScraperReadiness(tableChecks, env),
  });
}

async function checkTable(supabase: any, table: string) {
  const required = table === "MYProductScout_Master";
  const startedAt = Date.now();
  const { data, count, error } = await supabase.from(table).select("*", { count: "exact" }).limit(1);

  return {
    table,
    required,
    reachable: !error,
    count: count ?? 0,
    sampleRows: data?.length ?? 0,
    columns: data?.[0] ? Object.keys(data[0]) : [],
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
    status: hasProductTable && hasProductRows ? "ready_for_planning" : "setup_required",
    bots: [
      {
        name: "Bot Scraper",
        status: "not_started",
        purpose: "Collect weekly marketplace product signals into a staging table before review.",
      },
      {
        name: "Bot Cleaner",
        status: "not_started",
        purpose: "Normalize names, categories, compliance flags, and supplier fields.",
      },
      {
        name: "Research Bot",
        status: env.aiProvider === "groq" && env.groqApiKey ? "ai_ready" : "needs_ai_provider",
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
