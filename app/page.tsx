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

    products = sortAndLimitProducts(data ?? [], 100);
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
