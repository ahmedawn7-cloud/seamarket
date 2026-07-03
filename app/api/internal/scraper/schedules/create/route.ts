import { NextResponse } from "next/server";
import { scraperConfig } from "@/lib/scraper/config/scraperConfig";
import { createSchedule } from "@/lib/scraper/core/scheduler";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${scraperConfig.secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.platform || !body.frequency) {
      return NextResponse.json({ error: "Platform and frequency are required" }, { status: 400 });
    }

    const schedule = await createSchedule(body);
    return NextResponse.json({ success: true, schedule });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
