import { NextResponse } from "next/server";
import { scorerConfig } from "@/lib/scorer/config";
import { runScorer } from "@/lib/scorer/engine";
import { getServiceSupabaseClientOrError } from "@/lib/supabase/serverClient";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${scorerConfig.secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error: configError } = getServiceSupabaseClientOrError();
    if (configError) {
      return NextResponse.json({ success: false, error: configError }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    
    let limit = parseInt(body.limit) || 50;
    if (limit > 200) limit = 200;
    if (limit < 1) limit = 1;

    const result = await runScorer(limit);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: "Service unavailable or feature not configured." }, { status: 500 });
  }
}

