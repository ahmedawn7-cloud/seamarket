import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PRODUCT_TABLES = ["MYProductScout_Master", "scraped_products"] as const;

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
        env: {
          hasUrl: Boolean(supabaseUrl),
          hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
          hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
        },
        tables: [],
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

  const tables = await Promise.all(
    PRODUCT_TABLES.map(async (table) => {
      const { count, data, error } = await supabase
        .from(table)
        .select("*", { count: "exact" })
        .limit(1);

      return {
        table,
        count,
        sampleRows: data?.length ?? 0,
        columns: data?.[0] ? Object.keys(data[0]) : [],
        sample: data?.[0] ? normalizeProductSample(data[0]) : null,
        error: error
          ? {
              code: error.code,
              message: error.message,
              details: error.details,
            }
          : null,
      };
    }),
  );

  return NextResponse.json({
    ok: tables.some((table) => !table.error && (table.count ?? 0) > 0),
    env: {
      hasUrl: true,
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
    },
    tables,
  });
}

function normalizeProductSample(product: any) {
  const cleanName = readField(product, ["Clean_Name_AI", "clean_name_ai"]);
  const productName = readField(product, ["Product_Name", "product_name"]);

  return {
    name:
      cleanName && cleanName !== "The language entered is not supported at this time."
        ? cleanName
        : productName,
    productName,
    imageUrlPresent: Boolean(readField(product, ["Image_URL", "image_url"])),
    productUrlPresent: Boolean(readField(product, ["Product_URL", "product_url"])),
    rank: readField(product, ["Rank", "rank", "Internal_Rank", "internal_rank"]),
    price: readField(product, ["Price_RM", "price", "Final_Price_Low"]),
    sales: readField(product, ["Sales", "sales"]),
    category: readField(product, ["Category", "category"]),
  };
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
