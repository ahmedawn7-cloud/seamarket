import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PRODUCT_TABLES = ["scraped_products", "MYProductScout_Master"] as const;

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      {
        ok: false,
        products: [],
        error: "Missing Supabase configuration.",
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

  const { data, error, tableName } = await fetchProducts(supabase);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        products: [],
        tableName,
        error: error.message,
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

  for (const tableName of PRODUCT_TABLES) {
    const response = await supabase.from(tableName).select("*").limit(500);

    if (response.error) {
      lastError = response.error;
      continue;
    }

    // Only return if we actually found data, otherwise fallback to the next table
    if (response.data && response.data.length > 0) {
      return {
        data: response.data,
        error: null,
        tableName,
      };
    }
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
  const usableCleanName =
    cleanName && cleanName !== "The language entered is not supported at this time."
      ? String(cleanName)
      : productName;
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
