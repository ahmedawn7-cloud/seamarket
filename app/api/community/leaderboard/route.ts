import { NextResponse } from "next/server";
import { getServiceSupabaseClientOrError } from "@/lib/supabase/serverClient";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { supabase, error: configError } = getServiceSupabaseClientOrError();
  if (!supabase) return NextResponse.json({ ok: false, leaderboard: [], error: configError }, { status: 503 });

  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "all_time";

  if (range === "week" || range === "month") {
    const from = new Date();
    from.setDate(from.getDate() - (range === "week" ? 7 : 30));

    const { data: logs, error: logError } = await supabase
      .from("community_contribution_activity_logs")
      .select("user_id,points_change,community_contributor_profiles(display_name,avatar_url,current_rank,approved_count,featured_count,total_points)")
      .gte("created_at", from.toISOString());

    if (logError) return NextResponse.json({ ok: false, leaderboard: [], error: "Service unavailable or feature not configured." }, { status: 500 });

    return NextResponse.json({
      ok: true,
      leaderboard: aggregateTimedLeaderboard(logs ?? []),
      range,
    });
  }

  const { data, error } = await supabase
    .from("community_contributor_profiles")
    .select("id,user_id,display_name,avatar_url,total_points,approved_count,featured_count,current_rank,badges")
    .order("total_points", { ascending: false })
    .order("approved_count", { ascending: false })
    .limit(25);

  if (error) return NextResponse.json({ ok: false, leaderboard: [], error: "Service unavailable or feature not configured." }, { status: 500 });

  return NextResponse.json({ ok: true, leaderboard: data ?? [], range });
}

function aggregateTimedLeaderboard(logs: any[]) {
  const byUser = new Map<string, any>();

  logs.forEach((log) => {
    const profile = Array.isArray(log.community_contributor_profiles)
      ? log.community_contributor_profiles[0]
      : log.community_contributor_profiles;
    const userId = log.user_id;
    const current = byUser.get(userId) || {
      user_id: userId,
      display_name: profile?.display_name || "Community member",
      avatar_url: profile?.avatar_url || null,
      current_rank: profile?.current_rank || "New Scout",
      approved_count: profile?.approved_count || 0,
      featured_count: profile?.featured_count || 0,
      total_points: 0,
      badges: [],
    };

    current.total_points += Number(log.points_change || 0);
    byUser.set(userId, current);
  });

  return Array.from(byUser.values())
    .sort((a, b) => b.total_points - a.total_points || b.approved_count - a.approved_count)
    .slice(0, 25);
}

