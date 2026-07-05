import { NextResponse } from "next/server";
import { getServiceSupabaseClientOrError } from "@/lib/supabase/serverClient";

const PRODUCT_TABLES = ["MYProductScout_Master", "scraped_products"] as const;

export const dynamic = "force-dynamic";

export async function GET() {
  const { supabase, error: configError } = getServiceSupabaseClientOrError();
  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        products: [],
        error: configError,
      },
      { status: 503 },
    );
  }

  const { data, error, tableName } = await fetchProducts(supabase);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        products: [],
        tableName,
        error: "Service unavailable or feature not configured.",
      },
      { status: 500 },
    );
  }

  const products = sortAndLimitProducts((data ?? []).map(normalizeProductRow), 100);

  return NextResponse.json({
    ok: true,
    tableName,
    count: products.length,
    sample: products[0] ?? null,
    products,
  });
}

async function fetchProducts(supabase: any) {
  let lastError: { message: string } | null = null;
  const candidates: Array<{ data: any[]; error: null; tableName: string; quality: number }> = [];

  for (const tableName of PRODUCT_TABLES) {
    const response = await supabase.from(tableName).select("*").limit(500);

    if (response.error) {
      lastError = response.error;
      continue;
    }

    const rows = Array.isArray(response.data) ? response.data : [];
    if (rows.length > 0) {
      candidates.push({
        data: rows,
        error: null,
        tableName,
        quality: scoreTableRows(rows, tableName),
      });
    }
  }

  if (candidates.length > 0) {
    const best = [...candidates].sort((left, right) => right.quality - left.quality)[0];
    return {
      data: best.data.filter((row) => !isDemoProductRow(row)),
      error: null,
      tableName: best.tableName,
    };
  }

  return {
    data: [],
    error: lastError,
    tableName: null,
  };
}

function sortAndLimitProducts(products: any[], limit: number) {
  return [...products]
    .sort((left, right) => getSortScore(left) - getSortScore(right))
    .slice(0, limit);
}

function getSortScore(product: any) {
  const numeric = Number(readField(product, ["rank", "Rank", "Internal_Rank", "internal_rank"]));
  return Number.isFinite(numeric) ? numeric : Number.POSITIVE_INFINITY;
}

function normalizeProductRow(product: any) {
  const productName = String(readField(product, ["Product_Name", "product_name"]) || "Unknown product");
  const cleanName = readField(product, ["Clean_Name_AI", "clean_name_ai"]);
  const usableCleanName = isUsableCleanName(cleanName) ? String(cleanName) : productName;
  const productUrl = String(readField(product, ["Product_URL", "product_url"]) || "");
  const imageUrl = String(readField(product, ["Image_URL", "image_url"]) || "");

  return {
    id: String(readField(product, ["id", "Product_URL", "product_url", "Product_Name"]) || productName),
    clean_name_ai: usableCleanName,
    product_name: productName,
    image_url: getProxiedImageUrl(imageUrl, productUrl),
    original_image_url: imageUrl,
    product_url: productUrl,
    platform: getProductPlatform(product),
    category: String(readField(product, ["Category", "category"]) || "Uncategorized"),
    brand: String(readField(product, ["Brand", "brand"]) || ""),
    store_name: String(readField(product, ["Store_Name", "store_name"]) || ""),
    rank: readField(product, ["Rank", "rank", "Internal_Rank", "internal_rank"]) ?? null,
    internal_rank: readField(product, ["Internal_Rank", "internal_rank"]) ?? null,
    trend_rank: readField(product, ["Trend_Rank", "trend_rank"]) ?? null,
    price: readField(product, ["Price_RM", "price", "Final_Price_Low"]) ?? null,
    price_rm: readField(product, ["Price_RM", "price_rm"]) ?? null,
    sales: readField(product, ["Sales", "sales"]) ?? null,
    review_count: readField(product, ["Review_Count", "review_count"]) ?? null,
    rating_score: readField(product, ["Rating_Score", "rating_score"]) ?? null,
    stock_level: readField(product, ["Stock_Level", "stock_level"]) ?? null,
    shipping_location:
      readField(product, ["Shipping_Location", "shipping_location", "Shipping_Location_1"]) || "",
    variant_count: readField(product, ["Variant_Count", "variant_count"]) ?? null,
  };
}

function isUsableCleanName(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return false;

  const blockedStarts = [
    "The language entered is not supported",
    "I do not have",
    "I do not have enough information",
    "Please provide",
  ];

  return !blockedStarts.some((phrase) => text.startsWith(phrase));
}

function scoreTableRows(rows: any[], tableName: string) {
  const scoredRows = rows.slice(0, 100);
  let score = tableName === "MYProductScout_Master" ? 1000 : 0;

  for (const row of scoredRows) {
    if (!isDemoProductRow(row)) score += 25;
    if (readField(row, ["Product_Name", "product_name"])) score += 8;
    if (readField(row, ["Price_RM", "price", "Final_Price_Low"])) score += 8;
    if (readField(row, ["Sales", "sales"])) score += 8;
    if (readField(row, ["Rank", "rank", "Internal_Rank", "internal_rank"])) score += 6;
    if (readField(row, ["Image_URL", "image_url"])) score += 4;
  }

  return score;
}

function isDemoProductRow(product: any) {
  const productUrl = String(readField(product, ["Product_URL", "product_url"]) || "");
  const imageUrl = String(readField(product, ["Image_URL", "image_url"]) || "");
  const productName = String(readField(product, ["Product_Name", "product_name", "Clean_Name_AI", "clean_name_ai"]) || "");

  return (
    productUrl.startsWith("mock://") ||
    imageUrl.includes("dummyimage.com") ||
    productName.startsWith("TikTok Product (")
  );
}

function getProxiedImageUrl(imageUrl: string, productUrl: string) {
  if (!imageUrl) return "";

  const params = new URLSearchParams({ url: imageUrl });
  if (productUrl) params.set("referer", productUrl);

  return `/api/image-proxy?${params.toString()}`;
}

function getProductPlatform(product: any) {
  const explicitPlatform = readField(product, ["Platform", "platform"]);
  if (explicitPlatform) return String(explicitPlatform);

  const searchable = `${readField(product, ["Product_URL", "product_url"]) || ""} ${
    readField(product, ["Store_Name", "store_name"]) || ""
  } ${readField(product, ["Category", "category"]) || ""}`.toLowerCase();

  if (searchable.includes("shopee")) return "Shopee";
  if (searchable.includes("lazada")) return "Lazada";
  if (searchable.includes("tiktok") || searchable.includes("tikaka")) return "TikTok Shop";

  return "Marketplace";
}

function readField(product: any, fieldNames: string[]) {
  if (!product || typeof product !== "object") return undefined;

  for (const fieldName of fieldNames) {
    if (product[fieldName] !== undefined && product[fieldName] !== null && product[fieldName] !== "") {
      return product[fieldName];
    }
  }

  const normalizedLookup = new Map(
    Object.keys(product).map((key) => [key.trim().toLowerCase(), product[key]]),
  );

  for (const fieldName of fieldNames) {
    const value = normalizedLookup.get(fieldName.trim().toLowerCase());
    if (value !== undefined && value !== null && value !== "") return value;
  }

  return undefined;
}

