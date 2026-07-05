import { NextResponse } from "next/server";
import { ensureContributorProfile, getAuthenticatedContributionContext } from "@/lib/community/contributionServer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { supabase, user, error } = await getAuthenticatedContributionContext(request);
  if (!supabase) return NextResponse.json({ ok: false, error }, { status: 503 });
  if (!user) return NextResponse.json({ ok: false, error }, { status: 401 });

  try {
    const profile = await ensureContributorProfile(supabase, user);

    const { data: recommendations, error: recError } = await supabase
      .from("community_product_recommendations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (recError) throw recError;

    const { data: activity, error: activityError } = await supabase
      .from("community_contribution_activity_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (activityError) throw activityError;

    return NextResponse.json({
      ok: true,
      profile,
      recommendations: recommendations ?? [],
      activity: activity ?? [],
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Contributor profile could not be loaded." },
      { status: 500 },
    );
  }
}
