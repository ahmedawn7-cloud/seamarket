import "server-only";

import type { User } from "@supabase/supabase-js";
import { getServiceSupabaseClientOrError } from "@/lib/supabase/serverClient";
import {
  CONTRIBUTION_OWNER_EMAIL,
  getContributorBadges,
  getContributorRank,
  getPointsForActivity,
} from "@/lib/community/contributionRewards";

export async function getAuthenticatedContributionContext(request: Request) {
  const { supabase, error } = getServiceSupabaseClientOrError();
  if (!supabase) return { supabase: null, user: null, error: error || "Supabase server client is not configured." };

  const token = getBearerToken(request);
  if (!token) return { supabase, user: null, error: "Sign in is required for contribution tracking." };

  const { data, error: authError } = await supabase.auth.getUser(token);
  if (authError || !data.user) {
    return { supabase, user: null, error: authError?.message || "Invalid Supabase session." };
  }

  return { supabase, user: data.user, error: null };
}

export function isContributionAdmin(user: User | null) {
  const ownerEmail = (process.env.OPS_OWNER_EMAIL || CONTRIBUTION_OWNER_EMAIL).trim().toLowerCase();
  return Boolean(user?.email && user.email.toLowerCase() === ownerEmail);
}

export async function ensureContributorProfile(supabase: any, user: User) {
  const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Community member";
  const avatarUrl = user.user_metadata?.avatar_url || null;

  const { data: existing, error: existingError } = await supabase
    .from("community_contributor_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("community_contributor_profiles")
    .insert({
      user_id: user.id,
      display_name: displayName,
      avatar_url: avatarUrl,
      current_rank: "New Scout",
      badges: [],
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function applyContributionActivity({
  supabase,
  userId,
  profileId,
  recommendationId,
  actorUserId,
  activity,
  metadata = {},
}: {
  supabase: any;
  userId: string;
  profileId: string | null;
  recommendationId: string | null;
  actorUserId?: string | null;
  activity: string;
  metadata?: Record<string, unknown>;
}) {
  const points = getPointsForActivity(activity);
  const { data: profile, error: profileError } = await supabase
    .from("community_contributor_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) throw profileError;

  if (profile) {
    const nextProfile = getNextProfileValues(profile, activity, points);
    const { error: updateError } = await supabase
      .from("community_contributor_profiles")
      .update(nextProfile)
      .eq("id", profile.id);

    if (updateError) throw updateError;
  }

  const { error: logError } = await supabase.from("community_contribution_activity_logs").insert({
    user_id: userId,
    contributor_profile_id: profile?.id || profileId,
    recommendation_id: recommendationId,
    actor_user_id: actorUserId || userId,
    action: activity,
    points_change: points,
    metadata,
  });

  if (logError) throw logError;

  return points;
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return "";
  return header.slice(7).trim();
}

function getNextProfileValues(profile: any, activity: string, points: number) {
  const next = {
    total_points: Number(profile.total_points || 0) + points,
    submitted_count: Number(profile.submitted_count || 0),
    approved_count: Number(profile.approved_count || 0),
    rejected_count: Number(profile.rejected_count || 0),
    duplicate_count: Number(profile.duplicate_count || 0),
    needs_info_count: Number(profile.needs_info_count || 0),
    featured_count: Number(profile.featured_count || 0),
    sent_to_product_ops_count: Number(profile.sent_to_product_ops_count || 0),
  };

  if (activity === "recommendation_submitted") next.submitted_count += 1;
  if (activity === "recommendation_approved") next.approved_count += 1;
  if (activity === "recommendation_rejected") next.rejected_count += 1;
  if (activity === "recommendation_marked_duplicate") next.duplicate_count += 1;
  if (activity === "recommendation_needs_info") next.needs_info_count += 1;
  if (activity === "recommendation_featured") next.featured_count += 1;
  if (activity === "recommendation_sent_to_product_ops") next.sent_to_product_ops_count += 1;

  const badgeProfile = {
    ...profile,
    ...next,
  };

  return {
    ...next,
    current_rank: getContributorRank(next.approved_count),
    badges: getContributorBadges(badgeProfile),
    last_activity_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
