import { NextResponse } from "next/server";
import { ScraperController } from "@/lib/scraper/core/scraperController";
import { scraperConfig } from "@/lib/scraper/config/scraperConfig";
import { getServiceSupabaseClientOrError } from "@/lib/supabase/serverClient";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${scraperConfig.secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error: configError } = getServiceSupabaseClientOrError();
    if (configError) {
      return NextResponse.json({ success: false, error: configError }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const platform = body.platform || scraperConfig.defaultPlatform;
    const limit = body.limit || scraperConfig.defaultLimit;

    if (!scraperConfig.supportedPlatforms.includes(platform)) {
      return NextResponse.json({ error: `Unsupported platform: ${platform}` }, { status: 400 });
    }

    const controller = new ScraperController();
    
    // We can run this asynchronously, but for Vercel functions, we might want to wait if it's fast
    // or trigger a background job. For now, we await it since we mock with a small delay.
    const result = await controller.run(platform, limit);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: "Service unavailable or feature not configured." }, { status: 500 });
  }
}

