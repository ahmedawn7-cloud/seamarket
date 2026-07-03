import { NextResponse } from "next/server";
import { cleanerConfig } from "@/lib/cleaner/config";
import { runCleaner } from "@/lib/cleaner/engine";

export const maxDuration = 300; // Allow Vercel up to 5 minutes to run this

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cleanerConfig.secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    
    // Default limit 100, Max 500
    let limit = parseInt(body.limit) || 100;
    if (limit > 500) limit = 500;
    if (limit < 1) limit = 1;

    const result = await runCleaner(limit);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
