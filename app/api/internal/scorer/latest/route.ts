import { NextResponse } from "next/server";
import { scorerConfig } from "@/lib/scorer/config";
import { getServiceSupabaseClientOrError } from "@/lib/supabase/serverClient";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${scorerConfig.secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");

    const { supabase, error: configError } = getServiceSupabaseClientOrError();
    if (!supabase) {
      return NextResponse.json({ scores: [], error: configError }, { status: 503 });
    }

    const { data, error } = await supabase
      .from("product_scores")
      .select(`
        *,
        cleaned_products (
          clean_name_ai,
          normalized_category
        )
      `)
      .order("scored_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ scores: data });
  } catch (error: any) {
    return NextResponse.json({ error: "Service unavailable or feature not configured." }, { status: 500 });
  }
}

