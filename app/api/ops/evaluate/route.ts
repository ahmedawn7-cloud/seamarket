import { NextResponse } from "next/server";
import { MASTER_COLUMNS, createOpsSupabaseClient } from "@/lib/ops/supabaseOps";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const table = String(body.table || "MYProductScout_Master").trim();
    const dateField = String(body.dateField || "").trim();
    const dateFrom = String(body.dateFrom || "").trim();
    const dateTo = String(body.dateTo || "").trim();
    const supabase = createOpsSupabaseClient();

    let query = supabase.from(table).select("*", { count: "exact" }).limit(25);

    if (dateField && dateFrom) query = query.gte(dateField, dateFrom);
    if (dateField && dateTo) query = query.lte(dateField, dateTo);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          table,
          error: "Service unavailable or feature not configured.",
          code: error.code,
          hint: "Check the table name, RLS policy, and whether the SQL setup file was run.",
        },
        { status: 500 },
      );
    }

    const columns = data?.[0] ? Object.keys(data[0]) : [];
    const missingMasterColumns = MASTER_COLUMNS.filter((column) => !columns.includes(column));
    const quality = evaluateQuality(data ?? []);

    return NextResponse.json({
      ok: true,
      table,
      count: count ?? 0,
      sampleRows: data?.length ?? 0,
      columns,
      missingMasterColumns,
      exactMasterMatch: missingMasterColumns.length === 0,
      quality,
      sample: data?.[0] ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Evaluation failed." },
      { status: 500 },
    );
  }
}

function evaluateQuality(rows: any[]) {
  const total = rows.length || 1;
  const hasName = rows.filter((row) => row.Product_Name || row.product_name).length;
  const hasUrl = rows.filter((row) => row.Product_URL || row.product_url).length;
  const hasImage = rows.filter((row) => row.Image_URL || row.image_url).length;
  const hasPrice = rows.filter((row) => row.Price_RM || row.price_rm || row.Final_Price_Low).length;

  return {
    nameCoveragePct: Math.round((hasName / total) * 100),
    urlCoveragePct: Math.round((hasUrl / total) * 100),
    imageCoveragePct: Math.round((hasImage / total) * 100),
    priceCoveragePct: Math.round((hasPrice / total) * 100),
  };
}

