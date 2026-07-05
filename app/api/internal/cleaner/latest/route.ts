import { NextResponse } from "next/server";
import { cleanerConfig } from "@/lib/cleaner/config";
import { getServiceSupabaseClientOrError } from "@/lib/supabase/serverClient";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cleanerConfig.secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");

    const { supabase, error: configError } = getServiceSupabaseClientOrError();
    if (!supabase) {
      return NextResponse.json({ products: [], error: configError }, { status: 503 });
    }

    const { data, error } = await supabase
      .from("cleaned_products")
      .select("*")
      .order("cleaned_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ products: data });
  } catch (error: any) {
    return NextResponse.json({ error: "Service unavailable or feature not configured." }, { status: 500 });
  }
}

