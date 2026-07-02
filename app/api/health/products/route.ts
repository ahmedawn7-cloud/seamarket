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
