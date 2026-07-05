import { NextResponse } from "next/server";
import { getServiceSupabaseClientOrError } from "@/lib/supabase/serverClient";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { supabase, error: configError } = getServiceSupabaseClientOrError();
    if (!supabase) {
      return NextResponse.json({ products: [], error: configError }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    // Fetch cleaned_products joined with ALL layers
    const { data, error } = await supabase
      .from("cleaned_products")
      .select(`
        *,
        scraped_products (*),
        product_research (*),
        supplier_research (*),
        regulatory_research (*),
        product_scores (*)
      `)
      .neq("validation_status", "invalid")
      .order("cleaned_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ products: data });
  } catch (error: any) {
    return NextResponse.json({ error: "Service unavailable or feature not configured." }, { status: 500 });
  }
}

