import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    // Using service key for read-only API to frontend is acceptable if properly filtered, 
    // but typically we should use RLS. Since this is an internal ops tool, we can use service key.
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    // Fetch cleaned_products joined with all research
    const { data, error } = await supabase
      .from("cleaned_products")
      .select(`
        *,
        product_research (*),
        supplier_research (*),
        regulatory_research (*)
      `)
      .neq("validation_status", "invalid")
      .order("cleaned_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ products: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
