import { NextResponse } from "next/server";
import { scraperConfig } from "@/lib/scraper/config/scraperConfig";
import { getServiceSupabaseClientOrError } from "@/lib/supabase/serverClient";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${scraperConfig.secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const { supabase, error: configError } = getServiceSupabaseClientOrError();
    if (!supabase) {
      return NextResponse.json({ success: false, error: configError }, { status: 503 });
    }

    const { error } = await supabase
      .from("scraper_schedules")
      .delete()
      .eq("id", body.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Service unavailable or feature not configured." }, { status: 500 });
  }
}

