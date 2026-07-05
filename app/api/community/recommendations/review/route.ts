import { NextResponse } from "next/server";
import {
  applyContributionActivity,
  getAuthenticatedContributionContext,
  isContributionAdmin,
} from "@/lib/community/contributionServer";
import {
  getActivityForReviewAction,
  getPointsForActivity,
  getStatusForReviewAction,
  type ReviewAction,
} from "@/lib/community/contributionRewards";

export const dynamic = "force-dynamic";

const REVIEW_ACTIONS = ["approve", "reject", "duplicate", "needs_info", "feature", "send_to_product_ops", "archive"];

export async function POST(request: Request) {
  const { supabase, user, error } = await getAuthenticatedContributionContext(request);
  if (!supabase) return NextResponse.json({ ok: false, error }, { status: 503 });
  if (!user) return NextResponse.json({ ok: false, error }, { status: 401 });
  if (!isContributionAdmin(user)) {
    return NextResponse.json({ ok: false, error: "Admin access is required to review recommendations." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const recommendationId = String(body.recommendationId || "").trim();
    const action = String(body.action || "").trim() as ReviewAction;

    if (!recommendationId || !REVIEW_ACTIONS.includes(action)) {
      return NextResponse.json({ ok: false, error: "A valid recommendationId and review action are required." }, { status: 400 });
    }

    const { data: recommendation, error: fetchError } = await supabase
      .from("community_product_recommendations")
      .select("*")
      .eq("id", recommendationId)
      .single();

    if (fetchError || !recommendation) {
      return NextResponse.json({ ok: false, error: fetchError?.message || "Recommendation not found." }, { status: 404 });
    }

    const activity = getActivityForReviewAction(action);
    const alreadyLogged = await hasActivityLog(supabase, recommendationId, activity);
    const productOpsResult = action === "send_to_product_ops" ? await createProductOpsIntake(supabase, recommendation, user.email || "admin") : null;

    const nextStatus = getStatusForReviewAction(action);
    const pointsDelta = alreadyLogged ? 0 : getPointsForActivity(activity);
    const updates: Record<string, unknown> = {
      status: nextStatus,
      admin_feedback: normalizeOptionalString(body.adminFeedback),
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      points_awarded: Number(recommendation.points_awarded || 0) + pointsDelta,
    };

    if (action === "duplicate") updates.duplicate_of = normalizeOptionalString(body.duplicateOf);
    if (action === "feature") updates.featured = true;
    if (action === "send_to_product_ops") {
      updates.sent_to_product_ops = true;
      if (productOpsResult?.id) updates.product_intake_id = productOpsResult.id;
    }
    if (action === "archive") updates.featured = false;

    const { data: updated, error: updateError } = await supabase
      .from("community_product_recommendations")
      .update(updates)
      .eq("id", recommendationId)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ ok: false, error: "Service unavailable or feature not configured." }, { status: 500 });
    }

    if (!alreadyLogged) {
      await applyContributionActivity({
        supabase,
        userId: recommendation.user_id,
        profileId: recommendation.contributor_profile_id,
        recommendationId,
        actorUserId: user.id,
        activity,
        metadata: {
          admin_feedback: updates.admin_feedback,
          product_intake_id: productOpsResult?.id || null,
          product_ops_error: productOpsResult?.error || null,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      recommendation: updated,
      pointsDelta,
      productOps: productOpsResult,
      skippedDuplicateActivity: alreadyLogged,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Recommendation review failed." },
      { status: 500 },
    );
  }
}

async function hasActivityLog(supabase: any, recommendationId: string, action: string) {
  const { count } = await supabase
    .from("community_contribution_activity_logs")
    .select("id", { count: "exact", head: true })
    .eq("recommendation_id", recommendationId)
    .eq("action", action);

  return Boolean((count ?? 0) > 0);
}

async function createProductOpsIntake(supabase: any, recommendation: any, adminEmail: string) {
  const weekLabel = getWeekLabel();
  const { data, error } = await supabase
    .from("product_intake")
    .insert({
      week_label: weekLabel,
      product_name: recommendation.product_name,
      platform: recommendation.platform_found_on,
      product_url: recommendation.product_url,
      image_url: recommendation.image_url,
      category: recommendation.category,
      price_rm: recommendation.price_rm,
      approximate_sales: recommendation.approximate_sales,
      source_keyword: recommendation.source_keyword,
      notes: `Community recommendation: ${recommendation.why_trending}${recommendation.notes ? `\n\nNotes: ${recommendation.notes}` : ""}`,
      agent_name: "Community Contributor Program",
      agent_email: adminEmail,
      status: "submitted",
    })
    .select("id")
    .single();

  if (error) return { id: null, error: "Service unavailable or feature not configured." };
  return { id: data.id as string, error: null };
}

function getWeekLabel() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const firstDay = new Date(Date.UTC(year, 0, 1));
  const dayNumber = Math.floor((now.getTime() - firstDay.getTime()) / 86400000) + 1;
  const week = Math.ceil(dayNumber / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function normalizeOptionalString(value: unknown) {
  const text = String(value || "").trim();
  return text.length ? text : null;
}

