import { NextResponse } from "next/server";
import { scraperConfig } from "@/lib/scraper/config/scraperConfig";
import { runDueSchedules } from "@/lib/scraper/core/scheduler";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${scraperConfig.secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await runDueSchedules();
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
