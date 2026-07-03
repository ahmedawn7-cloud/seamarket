import { NextResponse } from "next/server";
import { MASTER_TABLE, STAGING_TABLE, createOpsSupabaseClient, mapStagingToMaster } from "@/lib/ops/supabaseOps";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sourceTable = String(body.sourceTable || STAGING_TABLE).trim();
    const targetTable = String(body.targetTable || MASTER_TABLE).trim();
    const limit = Math.min(Math.max(Number(body.limit) || 25, 1), 100);
    const confirm = String(body.confirm || "").trim();

    if (targetTable !== MASTER_TABLE) {
      return NextResponse.json({ ok: false, error: "Promotion target must be MYProductScout_Master." }, { status: 400 });
    }

    if (confirm !== "PROMOTE") {
      return NextResponse.json({ ok: false, error: "Type PROMOTE to confirm master table insertion." }, { status: 400 });
    }

    const supabase = createOpsSupabaseClient();
    const { data: stagingRows, error: sourceError } = await supabase.from(sourceTable).select("*").limit(limit);

    if (sourceError) {
      return NextResponse.json(
        { ok: false, error: sourceError.message, hint: "Run SCRAPER_BOT_SETUP.sql if the staging table does not exist." },
        { status: 500 },
      );
    }

    if (!stagingRows?.length) {
      return NextResponse.json({ ok: false, error: "No staging rows found to promote." }, { status: 400 });
    }

    const mappedRows = stagingRows.map(mapStagingToMaster).filter((row) => row.Product_Name && row.Product_URL);

    if (!mappedRows.length) {
      return NextResponse.json(
        { ok: false, error: "No rows passed quality gate. Product_Name and Product_URL are required." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase.from(targetTable).insert(mappedRows).select("*");

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      sourceTable,
      targetTable,
      requested: stagingRows.length,
      promoted: data?.length ?? mappedRows.length,
      columnsMapped: Object.keys(mappedRows[0] ?? {}),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Promotion failed." },
      { status: 500 },
    );
  }
}
