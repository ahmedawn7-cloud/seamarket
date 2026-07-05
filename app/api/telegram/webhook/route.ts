import { NextResponse } from "next/server";
import { getServiceSupabaseClientOrError } from "@/lib/supabase/serverClient";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "Profit Pilot AI Telegram webhook",
    commands: ["/start", "/help", "/getupdates", "/get updates"],
  });
}

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();

  if (!token) {
    return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN is not configured." }, { status: 500 });
  }

  try {
    const update = await request.json();
    const message = update.message || update.channel_post || update.edited_message;
    const chatId = message?.chat?.id;
    const text = String(message?.text || "").trim();

    if (!chatId) {
      return NextResponse.json({ ok: true, skipped: "No chat id in update." });
    }

    const reply = await buildReply(text);
    await sendTelegramMessage(token, String(chatId), reply);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Telegram webhook failed." },
      { status: 500 },
    );
  }
}

async function buildReply(text: string) {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();

  if (!normalized || normalized === "/start" || normalized === "/help") {
    return [
      "Profit Pilot AI alerts are online.",
      "",
      "Commands:",
      "/getupdates - latest product intelligence summary",
      "/help - show commands",
    ].join("\n");
  }

  if (
    normalized.includes("/getupdates") ||
    normalized.includes("/get_updates") ||
    normalized.includes("/get updates") ||
    normalized.includes("trend") ||
    normalized.includes("updates")
  ) {
    return buildProductUpdateSummary();
  }

  return "I received your message. Use /getupdates for the latest product intelligence summary.";
}

async function buildProductUpdateSummary() {
  const { supabase, error: configError } = getServiceSupabaseClientOrError();
  if (!supabase) {
    return `Product updates are not available because Supabase is not configured: ${configError}`;
  }

  const { data, error } = await supabase.from("MYProductScout_Master").select("*").limit(500);

  if (error) {
    return `Product updates are not available yet: ${error.message}`;
  }

  const products = data ?? [];
  if (products.length === 0) {
    return "No product rows are available in MYProductScout_Master yet.";
  }

  const latestDate = getLatestValue(products, ["Scrape_Date", "scrape_date"]);
  const topCategory = getTopCategory(products);
  const fastestProduct = getTopProduct(products, ["Trend_Rank", "trend_rank", "Rank", "Internal_Rank"], "asc");
  const topSalesProduct = getTopProduct(products, ["Sales", "sales"], "desc");
  const topProfitProduct = getTopProduct(products, ["Profit_Score", "profit_score", "ROI_Calc", "roi_calc"], "desc");

  return [
    "Profit Pilot AI product intelligence update",
    latestDate ? `Latest scrape date: ${latestDate}` : "Latest scrape date: not available",
    `Products checked: ${products.length}`,
    "",
    `Top category: ${topCategory.name} (${topCategory.count} products)`,
    `Fastest mover: ${formatProductLine(fastestProduct)}`,
    `Highest sales signal: ${formatProductLine(topSalesProduct)}`,
    `Best profit signal: ${formatProductLine(topProfitProduct)}`,
    "",
    "Note: true week-over-week change alerts need a product snapshot history table. Current alert uses the latest in-house product table.",
  ].join("\n");
}

async function sendTelegramMessage(token: string, chatId: string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload.description || "Telegram message failed.");
  }
}

function getTopCategory(products: any[]) {
  const counts = new Map<string, number>();

  for (const product of products) {
    const category = String(readField(product, ["Category", "category"]) || "Uncategorized");
    counts.set(category, (counts.get(category) || 0) + 1);
  }

  const [name, count] =
    [...counts.entries()].sort((left, right) => right[1] - left[1])[0] || ["Uncategorized", products.length];

  return { name, count };
}

function getTopProduct(products: any[], fields: string[], direction: "asc" | "desc") {
  return [...products]
    .map((product) => ({
      product,
      score: Number(readField(product, fields)),
    }))
    .filter((item) => Number.isFinite(item.score))
    .sort((left, right) => (direction === "asc" ? left.score - right.score : right.score - left.score))[0];
}

function formatProductLine(item?: { product: any; score: number }) {
  if (!item) return "not available";

  const name =
    readField(item.product, ["Clean_Name_AI", "clean_name_ai", "Product_Name", "product_name"]) ||
    "Unknown product";
  const category = readField(item.product, ["Category", "category"]) || "Uncategorized";

  return `${String(name).slice(0, 80)} / ${category} / score ${item.score}`;
}

function getLatestValue(products: any[], fields: string[]) {
  const values = products
    .map((product) => readField(product, fields))
    .filter(Boolean)
    .map(String)
    .sort()
    .reverse();

  return values[0] || "";
}

function readField(product: any, fieldNames: string[]) {
  if (!product || typeof product !== "object") return undefined;

  for (const fieldName of fieldNames) {
    if (product[fieldName] !== undefined && product[fieldName] !== null && product[fieldName] !== "") {
      return product[fieldName];
    }
  }

  const normalizedLookup = new Map(Object.keys(product).map((key) => [key.trim().toLowerCase(), product[key]]));

  for (const fieldName of fieldNames) {
    const value = normalizedLookup.get(fieldName.trim().toLowerCase());
    if (value !== undefined && value !== null && value !== "") return value;
  }

  return undefined;
}

