import { NextResponse } from "next/server";
import { getServiceSupabaseClientOrError } from "@/lib/supabase/serverClient";

export const dynamic = "force-dynamic";

export async function GET() {
  const { supabase, error } = getServiceSupabaseClientOrError();
  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        queue: [],
        summary: null,
        error,
      },
      { status: 503 },
    );
  }

  const [queueResult, approvedResult] = await Promise.all([
    supabase
      .from("community_product_recommendations")
      .select("id,product_name,platform_found_on,category,status,featured,created_at,product_intake_id,community_contributor_profiles(display_name,current_rank)")
      .in("status", ["pending_review", "needs_info", "approved", "featured", "sent_to_product_ops"])
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("community_product_recommendations")
      .select("id,status", { count: "exact", head: true })
      .in("status", ["approved", "featured", "sent_to_product_ops"]),
  ]);

  if (queueResult.error) {
    const friendlyError =
      queueResult.error.message.includes("community_product_recommendations") ||
      queueResult.error.message.toLowerCase().includes("schema cache")
        ? "Community recommendation tables are not created in Supabase yet. Run the contribution rewards migration first."
        : queueResult.error.message;

    return NextResponse.json(
      {
        ok: false,
        queue: [],
        summary: null,
        error: friendlyError,
      },
      { status: 500 },
    );
  }

  const queue = Array.isArray(queueResult.data)
    ? queueResult.data.map((item) => {
        const contributor = Array.isArray(item.community_contributor_profiles)
          ? item.community_contributor_profiles[0]
          : item.community_contributor_profiles;

        return {
          id: item.id,
          product_name: item.product_name,
          platform: item.platform_found_on,
          category: item.category || "Uncategorized",
          status: item.status,
          featured: Boolean(item.featured),
          created_at: item.created_at,
          contributor_name: contributor?.display_name || "Contributor",
          contributor_rank: contributor?.current_rank || "New Scout",
          promoted_to_ops: Boolean(item.product_intake_id || item.status === "sent_to_product_ops"),
        };
      })
    : [];

  const summary = {
    totalVisible: queue.length,
    pendingReview: queue.filter((item) => item.status === "pending_review").length,
    needsInfo: queue.filter((item) => item.status === "needs_info").length,
    approved: approvedResult.count ?? 0,
    promotedToOps: queue.filter((item) => item.promoted_to_ops).length,
  };

  return NextResponse.json({
    ok: true,
    queue,
    summary,
  });
}

