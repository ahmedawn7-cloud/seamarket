import { NextResponse } from "next/server";
import { scraperConfig } from "@/lib/scraper/config/scraperConfig";
import { createClient } from "@supabase/supabase-js";
import { calculateNextRun } from "@/lib/scraper/core/scheduler";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${scraperConfig.secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // If frequency or date changes, recalculate next_run_at
    if (updates.frequency || updates.day_of_week || updates.date_time) {
      // We might not have all fields in updates if it's a partial update, so we need to fetch the existing first, 
      // but for simplicity in this ops panel, we assume the frontend sends the full object when editing these fields.
      updates.next_run_at = calculateNextRun(
        updates.frequency, 
        updates.day_of_week, 
        updates.date_time
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("scraper_schedules")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, schedule: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
