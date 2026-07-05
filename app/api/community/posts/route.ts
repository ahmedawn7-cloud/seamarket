import { NextResponse } from "next/server";
import { getServiceSupabaseClientOrError } from "@/lib/supabase/serverClient";

export const dynamic = "force-dynamic";

export async function GET() {
  const { supabase, error: configError } = getServiceSupabaseClientOrError();
  if (!supabase) {
    return NextResponse.json({ ok: false, posts: [], error: configError }, { status: 503 });
  }

  const { data: posts, error } = await supabase
    .from("community_posts")
    .select("id,user_id,title,body,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ ok: false, posts: [], error: "Service unavailable or feature not configured." }, { status: 500 });
  }

  const userIds = Array.from(new Set((posts ?? []).map((post: any) => post.user_id).filter(Boolean)));
  const profilesById = new Map<string, any>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id,display_name,business_type,avatar_url,plan")
      .in("id", userIds);

    (profiles ?? []).forEach((profile: any) => profilesById.set(profile.id, profile));
  }

  return NextResponse.json({
    ok: true,
    posts: (posts ?? []).map((post: any) => {
      const profile = profilesById.get(post.user_id);
      return {
        id: post.id,
        userId: post.user_id,
        author: profile?.display_name || "Community member",
        role: profile?.business_type || (profile?.plan === "pro" ? "Pro Seller" : "Member"),
        avatarUrl: profile?.avatar_url || null,
        time: formatRelativeTime(post.created_at),
        content: post.body || post.title || "",
        likes: 0,
        comments: 0,
        rating: 0,
      };
    }),
  });
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

