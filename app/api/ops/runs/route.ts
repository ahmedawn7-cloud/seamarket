import { NextResponse } from "next/server";
import { createOpsSupabaseClient } from "@/lib/ops/supabaseOps";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const botName = String(body.botName || "").trim();
    const platform = String(body.platform || "Internal").trim();
    const dateFrom = String(body.dateFrom || "").trim();
    const dateTo = String(body.dateTo || "").trim();
    const targetTable = String(body.targetTable || "").trim();

    if (!botName) {
      return NextResponse.json({ ok: false, error: "Bot name is required." }, { status: 400 });
    }

    const supabase = createOpsSupabaseClient();
    const { data, error } = await supabase
      .from("scraper_runs")
      .insert({
        bot_name: botName,
        platform,
        status: "queued",
        items_requested: Number(body.targetRows) || 100,
        metadata: {
          dateFrom,
          dateTo,
          targetTable,
          mode: "operator_queued",
          note: "Run queued from ops console. Execution worker will be connected later.",
        },
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: "Service unavailable or feature not configured.",
          code: error.code,
          hint: "Run SCRAPER_BOT_SETUP.sql in Supabase if scraper_runs does not exist.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, run: data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not queue bot run." },
      { status: 500 },
    );
  }
}

