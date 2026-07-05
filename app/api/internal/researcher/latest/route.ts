import { NextResponse } from "next/server";
import { researcherConfig } from "@/lib/researcher/config";
import { getServiceSupabaseClientOrError } from "@/lib/supabase/serverClient";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${researcherConfig.secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");

    const { supabase, error: configError } = getServiceSupabaseClientOrError();
    if (!supabase) {
      return NextResponse.json({ research: [], error: configError }, { status: 503 });
    }

    // Fetch product_research joined with cleaned_products and regulatory_research
    const { data, error } = await supabase
      .from("product_research")
      .select(`
        *,
        cleaned_products (
          clean_name_ai,
          original_product_name,
          normalized_category,
          language
        ),
        regulatory_research!inner (
          sirim_risk,
          kkm_risk,
          npra_risk,
          restricted_product_risk
        )
      `)
      .order("researched_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ research: data });
  } catch (error: any) {
    return NextResponse.json({ error: "Service unavailable or feature not configured." }, { status: 500 });
  }
}

