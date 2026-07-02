import Dashboard from "@/components/Dashboard";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const PRODUCT_TABLES = ["MYProductScout_Master", "scraped_products"] as const;

export default async function Home() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  let products: any[] = [];

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error, tableName } = await fetchProducts(supabase);

    if (error) {
      console.error(
        `Supabase products fetch failed${tableName ? ` for ${tableName}` : ""}:`,
        error.message,
      );
    }

    products = sortAndLimitProducts((data ?? []).map(normalizeProductRow), 100);
  } else {
    console.error(
      "Missing Supabase configuration. Check NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return <Dashboard initialProducts={products} />;
}

async function fetchProducts(supabase: any) {
  let lastError: { message: string } | null = null;

  for (const tableName of PRODUCT_TABLES) {
    const response = await supabase.from(tableName).select("*").limit(500);

    if (response.error) {
      lastError = response.error;
      continue;
    }

    return {
      data: response.data ?? [],
      error: null,
      tableName,
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
  const candidates = [
    product?.Rank,
    product?.rank,
    product?.Internal_Rank,
    product?.internal_rank,
    product?.Trend_Rank,
    product?.trend_rank,
  ];

  for (const candidate of candidates) {
    const numeric = Number(candidate);
    if (Number.isFinite(numeric)) return numeric;
  }

  return Number.POSITIVE_INFINITY;
}

function normalizeProductRow(product: any) {
  const productName = product?.Product_Name || product?.product_name || "Unknown product";
  const cleanName = product?.Clean_Name_AI || product?.clean_name_ai;
  const usableCleanName =
    cleanName && cleanName !== "The language entered is not supported at this time."
      ? cleanName
      : productName;
  const productUrl = product?.Product_URL || product?.product_url || "";
  const imageUrl = product?.Image_URL || product?.image_url || "";
  const category = product?.Category || product?.category || "Uncategorized";
  const storeName = product?.Store_Name || product?.store_name || "";

  return {
    ...product,
    clean_name_ai: usableCleanName,
    product_name: productName,
    image_url: imageUrl,
    product_url: productUrl,
    platform: getProductPlatform(product),
    category,
    brand: product?.Brand || product?.brand || "",
    store_name: storeName,
    rank: product?.Rank ?? product?.rank ?? product?.Internal_Rank ?? product?.internal_rank ?? null,
    internal_rank: product?.Internal_Rank ?? product?.internal_rank ?? null,
    trend_rank: product?.Trend_Rank ?? product?.trend_rank ?? null,
    price: product?.Price_RM ?? product?.price ?? product?.Final_Price_Low ?? null,
    price_rm: product?.Price_RM ?? product?.price_rm ?? null,
    sales: product?.Sales ?? product?.sales ?? null,
    review_count: product?.Review_Count ?? product?.review_count ?? null,
    rating_score: product?.Rating_Score ?? product?.rating_score ?? null,
    stock_level: product?.Stock_Level ?? product?.stock_level ?? null,
    shipping_location:
      product?.Shipping_Location || product?.shipping_location || product?.Shipping_Location_1 || "",
    variant_count: product?.Variant_Count ?? product?.variant_count ?? null,
  };
}

function getProductPlatform(product: any) {
  const explicitPlatform = product?.Platform || product?.platform;
  if (explicitPlatform) return String(explicitPlatform);

  const searchable = `${product?.Product_URL || ""} ${product?.product_url || ""} ${
    product?.Store_Name || ""
  } ${product?.Category || ""}`.toLowerCase();

  if (searchable.includes("shopee")) return "Shopee";
  if (searchable.includes("lazada")) return "Lazada";
  if (searchable.includes("tiktok") || searchable.includes("tikaka")) return "TikTok Shop";

  return "Marketplace";
}
