import { NextResponse } from "next/server";
import {
  applyContributionActivity,
  ensureContributorProfile,
  getAuthenticatedContributionContext,
  isContributionAdmin,
} from "@/lib/community/contributionServer";
import { getServiceSupabaseClientOrError } from "@/lib/supabase/serverClient";

export const dynamic = "force-dynamic";

const DAILY_LIMIT = 20;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const adminMode = url.searchParams.get("admin") === "1";
  const mineOnly = url.searchParams.get("mine") === "1";
  const token = request.headers.get("authorization") || request.headers.get("Authorization");

  if (!adminMode && !mineOnly && !token) {
    const { supabase, error } = getServiceSupabaseClientOrError();
    if (!supabase) return NextResponse.json({ ok: false, recommendations: [], error }, { status: 503 });

    const { data, error: queryError } = await supabase
      .from("community_product_recommendations")
      .select("*, community_contributor_profiles(display_name,avatar_url,current_rank,total_points)")
      .in("status", ["approved", "featured", "sent_to_product_ops"])
      .order("created_at", { ascending: false })
      .limit(50);

    if (queryError) return NextResponse.json({ ok: false, recommendations: [], error: "Service unavailable or feature not configured." }, { status: 500 });
    return NextResponse.json({ ok: true, recommendations: data ?? [] });
  }

  const { supabase, user, error } = await getAuthenticatedContributionContext(request);
  if (!supabase) return NextResponse.json({ ok: false, error }, { status: 503 });
  if (!user) return NextResponse.json({ ok: false, error }, { status: 401 });

  if (adminMode && !isContributionAdmin(user)) {
    return NextResponse.json({ ok: false, error: "Admin access is required." }, { status: 403 });
  }

  let query = supabase
    .from("community_product_recommendations")
    .select("*, community_contributor_profiles(display_name,avatar_url,current_rank,total_points)")
    .order("created_at", { ascending: false })
    .limit(adminMode ? 100 : 50);

  if (adminMode) {
    query = query.in("status", ["pending_review", "needs_info"]);
  } else if (mineOnly) {
    query = query.eq("user_id", user.id);
  } else {
    query = query.or(`user_id.eq.${user.id},status.in.(approved,featured,sent_to_product_ops),featured.eq.true`);
  }

  const { data, error: queryError } = await query;
  if (queryError) return NextResponse.json({ ok: false, error: "Service unavailable or feature not configured." }, { status: 500 });

  return NextResponse.json({ ok: true, recommendations: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user, error } = await getAuthenticatedContributionContext(request);
  if (!supabase) return NextResponse.json({ ok: false, error }, { status: 503 });
  if (!user) return NextResponse.json({ ok: false, error }, { status: 401 });

  try {
    const body = await request.json();
    const productNameInput = String(body.product_name || "").trim();
    const platform = String(body.platform_found_on || "").trim();
    const whyTrending = String(body.why_trending || "").trim();
    const productUrl = normalizeOptionalString(body.product_url);
    const productName = productNameInput || inferProductNameFromUrl(productUrl);
    const priceRm = normalizeOptionalNumber(body.price_rm);
    const status = productNameInput ? "pending_review" : "needs_info";

    if (!productUrl || !platform || !whyTrending || priceRm === null) {
      return NextResponse.json(
        { ok: false, error: "Product URL, platform, approximate price, and why you recommend it are required." },
        { status: 400 },
      );
    }

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const { count: todayCount } = await supabase
      .from("community_product_recommendations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", dayStart.toISOString());

    if ((todayCount ?? 0) >= DAILY_LIMIT) {
      return NextResponse.json(
        { ok: false, error: "Daily contribution limit reached. You can submit more recommendations tomorrow." },
        { status: 429 },
      );
    }

    const duplicateWarning = await findDuplicateWarning(supabase, productName, productUrl);
    const profile = await ensureContributorProfile(supabase, user);

    const { data: recommendation, error: insertError } = await supabase
      .from("community_product_recommendations")
      .insert({
        user_id: user.id,
        contributor_profile_id: profile.id,
        product_name: productName,
        platform_found_on: platform,
        product_url: productUrl,
        image_url: normalizeOptionalString(body.image_url),
        category: normalizeOptionalString(body.category),
        price_rm: priceRm,
        approximate_sales: normalizeOptionalNumber(body.approximate_sales),
        why_trending: whyTrending,
        source_keyword: normalizeOptionalString(body.source_keyword),
        notes: normalizeOptionalString(body.notes),
        status,
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ ok: false, error: "Service unavailable or feature not configured." }, { status: 500 });
    }

    const points = await applyContributionActivity({
      supabase,
      userId: user.id,
      profileId: profile.id,
      recommendationId: recommendation.id,
      activity: "recommendation_submitted",
      metadata: { product_name: productName, platform_found_on: platform, duplicateWarning },
    });

    await supabase
      .from("community_product_recommendations")
      .update({ points_awarded: points, updated_at: new Date().toISOString() })
      .eq("id", recommendation.id);

    return NextResponse.json({
      ok: true,
      recommendation: { ...recommendation, points_awarded: points },
      duplicateWarning,
      dailySubmissionCount: (todayCount ?? 0) + 1,
      warning: (todayCount ?? 0) + 1 >= 10 ? "You have submitted 10+ recommendations today. Keep quality high to avoid review delays." : null,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Recommendation submission failed." },
      { status: 500 },
    );
  }
}

async function findDuplicateWarning(supabase: any, productName: string, productUrl: string | null) {
  if (productUrl) {
    const { data } = await supabase
      .from("community_product_recommendations")
      .select("id,status,product_name")
      .eq("product_url", productUrl)
      .limit(1);
    if (data?.length) return `A recommendation with this URL already exists as ${data[0].status}.`;
  }

  const normalized = productName.slice(0, 48);
  if (normalized.length < 6) return null;
  const { data } = await supabase
    .from("community_product_recommendations")
    .select("id,status,product_name")
    .ilike("product_name", `%${normalized}%`)
    .limit(1);

  if (data?.length) return `A similar product may already exist: ${data[0].product_name} (${data[0].status}).`;
  return null;
}

function normalizeOptionalString(value: unknown) {
  const text = String(value || "").trim();
  return text.length ? text : null;
}

function normalizeOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function inferProductNameFromUrl(productUrl: string | null) {
  if (!productUrl) return "Needs review";

  try {
    const url = new URL(productUrl);
    const path = url.pathname.split("/").filter(Boolean).pop() || url.hostname;
    return `Needs review: ${decodeURIComponent(path).replace(/[-_]+/g, " ").slice(0, 90)}`;
  } catch {
    return "Needs review";
  }
}

