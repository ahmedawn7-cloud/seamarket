import { NextResponse } from "next/server";
import { researcherConfig } from "@/lib/researcher/config";
import { runResearcher } from "@/lib/researcher/engine";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${researcherConfig.secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    
    // Default limit 50, Max 200
    let limit = parseInt(body.limit) || 50;
    if (limit > 200) limit = 200;
    if (limit < 1) limit = 1;

    const result = await runResearcher(limit);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
