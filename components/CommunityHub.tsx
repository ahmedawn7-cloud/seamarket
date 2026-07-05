"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { Session } from "@supabase/supabase-js";
import {
  AlertCircle,
  Award,
  BadgeCheck,
  Bell,
  Bookmark,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Heart,
  MessageCircle,
  MoreHorizontal,
  RefreshCcw,
  Send,
  Share2,
  Star,
  Trash2,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import {
  CONTRIBUTION_OWNER_EMAIL,
  formatContributionStatus,
  type ContributorProfile,
  type ProductRecommendation,
  type ReviewAction,
} from "@/lib/community/contributionRewards";
import { getBrowserSupabaseClient } from "@/lib/supabase/browserClient";

const supabase = getBrowserSupabaseClient();
const TELEGRAM_SETTINGS_KEY = "profitpilot-telegram-settings";

const feedTabs = ["All", "Discussion", "Questions", "Wins", "News"];
const communitySections = ["Community Feed", "Product Recommendations", "Leaderboard", "My Contributions", "Rewards"] as const;
const platformOptions = ["Shopee", "Lazada", "TikTok Shop", "Lazada + Shopee", "Other"];
const categoryOptions = ["Beauty", "Home tools", "Pet supplies", "Modest fashion", "Plant care", "Fitness", "Electronics"];
const topics = ["Shopee trends", "TikTok Shop testing", "Supplier checks", "Malaysia logistics"];

type CommunitySection = (typeof communitySections)[number];

export default function CommunityHub({ session }: { session: Session | null }) {
  const [section, setSection] = useState<CommunitySection>("Community Feed");
  const [activeTab, setActiveTab] = useState("All");
  const [postText, setPostText] = useState("");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [postStatus, setPostStatus] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramStatus, setTelegramStatus] = useState("");
  const [telegramChats, setTelegramChats] = useState<TelegramChat[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<CommunityPost | null>(null);
  const [commentPostId, setCommentPostId] = useState<string | number | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, LocalComment[]>>({});
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [contributionStatus, setContributionStatus] = useState("");
  const [contributionError, setContributionError] = useState("");
  const [contributorProfile, setContributorProfile] = useState<ContributorProfile | null>(null);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [publicRecommendations, setPublicRecommendations] = useState<ProductRecommendation[]>([]);
  const [activityLogs, setActivityLogs] = useState<ContributionActivity[]>([]);
  const [leaderboard, setLeaderboard] = useState<ContributorProfile[]>([]);
  const [leaderboardRange, setLeaderboardRange] = useState("all_time");
  const [adminQueue, setAdminQueue] = useState<ProductRecommendation[]>([]);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [advancedRecommendationFields, setAdvancedRecommendationFields] = useState(false);
  const [recommendationDraft, setRecommendationDraft] = useState<RecommendationDraft>({
    product_name: "",
    platform_found_on: "Shopee",
    product_url: "",
    image_url: "",
    category: "",
    price_rm: "",
    approximate_sales: "",
    why_trending: "",
    source_keyword: "",
    notes: "",
  });

  const isAdmin = session?.user?.email?.toLowerCase() === CONTRIBUTION_OWNER_EMAIL;

  useEffect(() => {
    const telegram = loadTelegramSettings();
    setTelegramChatId(telegram.chatId || "");
    loadCommunity();
    loadContributionProgram();
  }, [session?.user?.id]);

  useEffect(() => {
    loadLeaderboard(leaderboardRange);
  }, [leaderboardRange]);

  const filteredPosts = posts.filter((post) => {
    if (activeTab === "All") return true;
    return post.topic === activeTab || post.content.toLowerCase().includes(activeTab.toLowerCase());
  });

  const approvedRecommendations = publicRecommendations.filter((item) =>
    ["approved", "featured", "sent_to_product_ops"].includes(item.status),
  );
  const pendingRecommendations = recommendations.filter((item) => item.status === "pending_review" || item.status === "needs_info");
  const myStats = useMemo(() => {
    const total = recommendations.length;
    const approved = recommendations.filter((item) => ["approved", "featured", "sent_to_product_ops"].includes(item.status)).length;
    const pending = recommendations.filter((item) => item.status === "pending_review" || item.status === "needs_info").length;
    return { total, approved, pending };
  }, [recommendations]);

  async function loadCommunity() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/community/posts", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.ok) throw new Error(payload.error || "Community posts could not be loaded.");

      const cloudPosts = Array.isArray(payload.posts)
        ? payload.posts.map((post: any) => normalizeCloudPost(post, session?.user?.id)).filter((post: CommunityPost) => post.content)
        : [];

      setPosts(cloudPosts);
      await loadCommunityActions(cloudPosts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Community sync failed.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadContributionProgram() {
    setContributionError("");
    await loadLeaderboard(leaderboardRange);
    await loadPublicRecommendations();

    if (!session?.access_token) {
      setContributorProfile(null);
      setRecommendations([]);
      setActivityLogs([]);
      setAdminQueue([]);
      return;
    }

    try {
      const profileResponse = await fetch("/api/community/contributor-profile", {
        cache: "no-store",
        headers: getAuthHeaders(session),
      });
      const profilePayload = await profileResponse.json();

      if (!profileResponse.ok || !profilePayload.ok) {
        throw new Error(profilePayload.error || "Contributor profile could not be loaded.");
      }

      setContributorProfile(normalizeContributorProfile(profilePayload.profile));
      setRecommendations(Array.isArray(profilePayload.recommendations) ? profilePayload.recommendations : []);
      setActivityLogs(Array.isArray(profilePayload.activity) ? profilePayload.activity : []);

      if (isAdmin) await loadAdminQueue();
    } catch (err) {
      console.warn("Community contribution program unavailable:", err);
      setContributionError("");
      setContributorProfile(null);
      setRecommendations([]);
      setActivityLogs([]);
      setAdminQueue([]);
    }
  }

  async function loadPublicRecommendations() {
    const response = await fetch("/api/community/recommendations", { cache: "no-store" });
    const payload = await response.json();
    if (response.ok && payload.ok) {
      setPublicRecommendations(Array.isArray(payload.recommendations) ? payload.recommendations : []);
    }
  }

  async function loadLeaderboard(range = "all_time") {
    const response = await fetch(`/api/community/leaderboard?range=${encodeURIComponent(range)}`, { cache: "no-store" });
    const payload = await response.json();
    if (response.ok && payload.ok) {
      setLeaderboard((payload.leaderboard || []).map(normalizeContributorProfile));
    }
  }

  async function loadAdminQueue() {
    if (!session?.access_token || !isAdmin) return;
    const response = await fetch("/api/community/recommendations?admin=1", {
      cache: "no-store",
      headers: getAuthHeaders(session),
    });
    const payload = await response.json();

    if (response.ok && payload.ok) {
      setAdminQueue(Array.isArray(payload.recommendations) ? payload.recommendations : []);
    }
  }

  async function loadCommunityActions(cloudPosts: CommunityPost[]) {
    if (!supabase || cloudPosts.length === 0) return;
    const postIds = cloudPosts.map((post) => String(post.id));

    try {
      const { data: comments } = await supabase
        .from("community_comments")
        .select("id,post_id,user_id,body,created_at")
        .in("post_id", postIds)
        .order("created_at", { ascending: true });

      if (Array.isArray(comments)) {
        const grouped: Record<string, LocalComment[]> = {};
        comments.forEach((comment: any) => {
          const postId = String(comment.post_id);
          grouped[postId] = [
            ...(grouped[postId] || []),
            {
              id: String(comment.id),
              author: comment.user_id === session?.user?.id ? "You" : "Community member",
              body: String(comment.body || ""),
              createdAt: String(comment.created_at || new Date().toISOString()),
            },
          ];
        });
        setCommentsByPost(grouped);
      }
    } catch {
      setCommentsByPost({});
    }

    if (!session?.user) return;

    try {
      const { data: reactions } = await supabase
        .from("community_post_reactions")
        .select("post_id")
        .eq("user_id", session.user.id)
        .in("post_id", postIds);
      setLikedPostIds(Array.isArray(reactions) ? reactions.map((item: any) => String(item.post_id)) : []);
    } catch {
      setLikedPostIds([]);
    }

    try {
      const { data: saves } = await supabase
        .from("user_saved_community_posts")
        .select("post_id")
        .eq("user_id", session.user.id)
        .in("post_id", postIds);
      setSavedPostIds(Array.isArray(saves) ? saves.map((item: any) => String(item.post_id)) : []);
    } catch {
      setSavedPostIds([]);
    }
  }

  async function createPost() {
    const content = postText.trim();
    if (!content) {
      setPostStatus("Write something before posting.");
      return;
    }

    if (!supabase || !session?.user) {
      setPostStatus("Sign in with Supabase to publish a shared community post.");
      return;
    }

    setPostStatus("Publishing...");
    const { error } = await supabase.from("community_posts").insert({
      user_id: session.user.id,
      title: content.slice(0, 80),
      body: content,
    });

    if (error) {
      console.warn("Community post save failed:", error.message);
      setPostStatus("Community posting is temporarily unavailable. Please try again after the community tables finish syncing.");
      return;
    }

    setPostText("");
    setPostStatus("Posted to Supabase community.");
    await loadCommunity();
  }

  async function submitRecommendation() {
    if (!session?.access_token) {
      setContributionStatus("Sign in to submit product recommendations and earn points.");
      return;
    }

    setContributionStatus("Submitting recommendation...");
    setContributionError("");

    const response = await fetch("/api/community/recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(session),
      },
      body: JSON.stringify(recommendationDraft),
    });
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      setContributionStatus("");
      setContributionError(formatContributionError(payload.error || "Recommendation could not be submitted."));
      return;
    }

    setRecommendationDraft({
      product_name: "",
      platform_found_on: "Shopee",
      product_url: "",
      image_url: "",
      category: "",
      price_rm: "",
      approximate_sales: "",
      why_trending: "",
      source_keyword: "",
      notes: "",
    });
    setContributionStatus(
      payload.duplicateWarning
        ? `Recommendation submitted for review. Note: ${payload.duplicateWarning}`
        : "Recommendation submitted for review. If approved, points will be added to your contributor profile.",
    );
    await loadContributionProgram();
    setSection("My Contributions");
  }

  async function reviewRecommendation(recommendationId: string, action: ReviewAction) {
    if (!session?.access_token || !isAdmin) {
      setContributionError("Admin sign-in is required to review recommendations.");
      return;
    }

    setContributionStatus(`Applying ${action.replaceAll("_", " ")}...`);
    const response = await fetch("/api/community/recommendations/review", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(session),
      },
      body: JSON.stringify({
        recommendationId,
        action,
        adminFeedback: reviewNotes[recommendationId] || null,
      }),
    });
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      setContributionStatus("");
      setContributionError(payload.error || "Admin review failed.");
      return;
    }

    setContributionStatus(`Review saved. Points delta: ${payload.pointsDelta}.`);
    setReviewNotes((current) => ({ ...current, [recommendationId]: "" }));
    await loadContributionProgram();
  }

  async function toggleLike(post: CommunityPost) {
    const postId = String(post.id);
    if (!supabase || !session?.user) {
      setPostStatus("Sign in to react to community posts.");
      return;
    }

    const isLiked = likedPostIds.includes(postId);
    setPostStatus(isLiked ? "Removing reaction..." : "Saving reaction...");

    const result = isLiked
      ? await supabase.from("community_post_reactions").delete().eq("user_id", session.user.id).eq("post_id", postId)
      : await supabase.from("community_post_reactions").insert({ user_id: session.user.id, post_id: postId, reaction: "like" });

    if (result.error) {
      console.warn("Community reaction failed:", result.error.message);
      setPostStatus("Reactions are temporarily unavailable.");
      return;
    }

    setLikedPostIds((current) => (isLiked ? current.filter((id) => id !== postId) : [...current, postId]));
    setPostStatus(isLiked ? "Reaction removed." : "Reaction saved.");
  }

  async function addComment(post: CommunityPost) {
    const postId = String(post.id);
    const body = (commentDrafts[postId] || "").trim();
    if (!body) return;

    if (!supabase || !session?.user) {
      setPostStatus("Sign in to comment on community posts.");
      return;
    }

    setPostStatus("Posting comment...");
    const { data, error } = await supabase
      .from("community_comments")
      .insert({ post_id: postId, user_id: session.user.id, body })
      .select("id,post_id,body,created_at")
      .single();

    if (error) {
      console.warn("Community comment failed:", error.message);
      setPostStatus("Comments are temporarily unavailable.");
      return;
    }

    setCommentsByPost((current) => ({
      ...current,
      [postId]: [
        ...(current[postId] || []),
        {
          id: String(data.id),
          author: "You",
          body: String(data.body || body),
          createdAt: String(data.created_at || new Date().toISOString()),
        },
      ],
    }));
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
    setCommentPostId(postId);
    setPostStatus("Comment saved to Supabase.");
  }

  async function saveCommunityPostToResearch(post: CommunityPost) {
    const postId = String(post.id);
    if (!supabase || !session?.user) {
      setPostStatus("Sign in to save community posts to your research workspace.");
      return;
    }

    setPostStatus("Saving post to research...");
    const { error } = await supabase.from("user_saved_community_posts").upsert({
      user_id: session.user.id,
      post_id: postId,
      snapshot: post,
    });

    if (error) {
      console.warn("Saved community post sync failed:", error.message);
      setPostStatus("Saved posts sync is temporarily unavailable.");
      return;
    }

    setSavedPostIds((current) => Array.from(new Set([...current, postId])));
    setPostStatus("Community post saved to your Supabase research workspace.");
  }

  async function followUser(post: CommunityPost) {
    if (!supabase || !session?.user || !post.userId) {
      setPostStatus("Sign in to follow community members.");
      return;
    }

    const { error } = await supabase.from("community_follows").upsert({
      follower_id: session.user.id,
      following_id: post.userId,
    });

    if (error) {
      console.warn("Community follow failed:", error.message);
      setPostStatus("Following is temporarily unavailable.");
      return;
    }

    setPostStatus(`Following ${post.author}.`);
  }

  function sharePost(post: CommunityPost) {
    const text = `${post.author} on Profit Pilot AI:\n${post.content}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "Profit Pilot AI community post", text }).catch(() => undefined);
      return;
    }

    navigator.clipboard?.writeText(text).catch(() => undefined);
    setPostStatus("Post copied for sharing.");
  }

  async function deletePost(post: CommunityPost) {
    if (!post.isMine) {
      setPostStatus("You can only delete your own posts.");
      return;
    }

    if (!supabase || !session?.user) {
      setPostStatus("Sign in to delete cloud community posts.");
      return;
    }

    const { error } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", post.id)
      .eq("user_id", session.user.id);

    if (error) {
      setPostStatus(`Cloud delete failed: ${error.message}`);
      return;
    }

    setPosts((current) => current.filter((item) => String(item.id) !== String(post.id)));
    setPostStatus("Post deleted from Supabase.");
  }

  async function sendTelegramTest() {
    const chatId = telegramChatId.trim();
    if (!chatId) {
      setTelegramStatus("Enter your Telegram chat ID first.");
      return;
    }

    localStorage.setItem(TELEGRAM_SETTINGS_KEY, JSON.stringify({ chatId }));
    setTelegramStatus("Sending test alert...");

    const response = await fetch("/api/telegram/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId,
        text: "Profit Pilot AI Telegram alerts are connected. Community and product alerts can be sent here.",
      }),
    });
    const payload = await response.json();

    setTelegramStatus(payload.ok ? "Telegram connected. Test alert sent." : `Telegram setup needed: ${payload.error}`);
  }

  async function findTelegramChats() {
    setTelegramStatus("Checking recent Telegram bot messages...");

    const response = await fetch("/api/telegram/updates", { cache: "no-store" });
    const payload = await response.json();

    if (!payload.ok) {
      setTelegramStatus(`Telegram setup needed: ${payload.error}`);
      return;
    }

    const chats = Array.isArray(payload.chats) ? payload.chats : [];
    setTelegramChats(chats);
    setTelegramStatus(
      chats.length > 0
        ? "Select your chat below, then send a test alert."
        : "No chats found yet. Open Telegram, send any message to your bot, then click Find chat ID again.",
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Community Hub</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Share seller intelligence, submit product recommendations, and build contributor reputation with Supabase-backed rewards.
          </p>
        </div>
        <button
          onClick={() => {
            loadCommunity();
            loadContributionProgram();
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-bold text-foreground transition hover:border-cyan-400"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-xl border border-border bg-card p-2">
        {communitySections.map((item) => (
          <button
            key={item}
            onClick={() => setSection(item)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition ${
              section === item ? "bg-cyan-500 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {contributionError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-300">
          {contributionError}
        </div>
      )}
      {contributionStatus && (
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-sm leading-6 text-cyan-300">
          {contributionStatus}
        </div>
      )}

      {section === "Community Feed" && renderFeedSection()}
      {section === "Product Recommendations" && renderRecommendationsSection()}
      {section === "Leaderboard" && renderLeaderboardSection()}
      {section === "My Contributions" && renderMyContributionsSection()}
      {section === "Rewards" && renderRewardsSection()}

      {selectedProfile && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl shadow-black/40">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar author={selectedProfile.author} avatarUrl={selectedProfile.avatarUrl || null} />
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selectedProfile.author}</h2>
                  <p className="text-sm text-cyan-300">{selectedProfile.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedProfile(null)} className="text-slate-500 hover:text-foreground">
                Close
              </button>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <ProfileStat label="Posts" value={selectedProfile.isMine ? "Yours" : "Public"} />
              <ProfileStat label="Likes" value={String(selectedProfile.likes)} />
              <ProfileStat label="Comments" value={String(selectedProfile.comments + (commentsByPost[String(selectedProfile.id)]?.length || 0))} />
            </div>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              This profile preview is based on Supabase community/profile data. Full public profile pages can be added after the profile and follow tables are finalized.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  function renderFeedSection() {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex gap-4">
              <Avatar author={getCommunityName(session)} avatarUrl={session?.user?.user_metadata?.avatar_url || null} highlight />
              <div className="flex-1 space-y-3">
                <input
                  value={postText}
                  onChange={(event) => setPostText(event.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground outline-none focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder={session?.user ? "What's on your mind? Share a product or ask a question..." : "Sign in to publish community posts"}
                  disabled={!session?.user}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {feedTabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-full px-4 py-1 text-xs font-medium transition ${
                          activeTab === tab
                            ? "border border-cyan-400/30 bg-cyan-500/20 text-cyan-300"
                            : "border border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={createPost}
                    disabled={!session?.user || !postText.trim()}
                    className="rounded-lg bg-cyan-500 px-6 py-2 text-sm font-bold text-foreground transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Post
                  </button>
                </div>
                {postStatus && <p className="text-xs text-cyan-300">{postStatus}</p>}
              </div>
            </div>
          </section>

          {loading && <StatePanel title="Loading community" text="Fetching shared posts from Supabase..." />}
          {!loading && error && (
            <StatePanel
              title="Community is still warming up"
              text="Shared posts are temporarily unavailable. Please try again shortly after the community tables finish syncing."
            />
          )}
          {!loading && !error && filteredPosts.length === 0 && (
            <StatePanel title="No shared community posts yet" text="Once members publish posts into Supabase, they will appear here." />
          )}

          <div className="space-y-4">
            {filteredPosts.map((post) => renderPost(post))}
          </div>
        </div>

        <div className="space-y-6">
          {renderContributorSummary()}
          {renderTelegramCard()}
          {renderTopicFilters()}
        </div>
      </div>
    );
  }

  function renderRecommendationsSection() {
    return (
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Contributor Rewards Program</p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">Submit a trending product recommendation</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Help the community discover high-potential products. Approved recommendations earn points and increase your contributor rank.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Product URL" value={recommendationDraft.product_url} onChange={(value) => setRecommendationField("product_url", value)} placeholder="Paste the listing URL" required />
            <TextField label="Product name" value={recommendationDraft.product_name} onChange={(value) => setRecommendationField("product_name", value)} placeholder="Optional if URL already identifies the product" />
            <TextField label="Approx price RM" value={recommendationDraft.price_rm} onChange={(value) => setRecommendationField("price_rm", value)} placeholder="Required number" required />
            <label className="grid gap-2 text-sm text-muted-foreground">
              Platform
              <select
                value={recommendationDraft.platform_found_on}
                onChange={(event) => setRecommendationField("platform_found_on", event.target.value)}
                className="rounded-lg border border-border bg-input px-4 py-3 text-foreground outline-none focus:border-cyan-400"
              >
                {platformOptions.map((platform) => (
                  <option key={platform}>{platform}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 grid gap-4">
            <TextArea
              label="Why do you recommend it?"
              value={recommendationDraft.why_trending}
              onChange={(value) => setRecommendationField("why_trending", value)}
              placeholder="Explain the demand signal, review quality, content angle, supplier edge, or why sellers should care."
              required
            />
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <button
                type="button"
                onClick={() => setAdvancedRecommendationFields((current) => !current)}
                className="text-sm font-bold text-cyan-300 transition hover:text-cyan-200"
              >
                {advancedRecommendationFields ? "Hide advanced fields" : "Add advanced details"}
              </button>
              {advancedRecommendationFields && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <TextField label="Image URL" value={recommendationDraft.image_url} onChange={(value) => setRecommendationField("image_url", value)} placeholder="Optional" />
                  <label className="grid gap-2 text-sm text-muted-foreground">
                    Category
                    <select
                      value={recommendationDraft.category}
                      onChange={(event) => setRecommendationField("category", event.target.value)}
                      className="rounded-lg border border-border bg-input px-4 py-3 text-foreground outline-none focus:border-cyan-400"
                    >
                      <option value="">Optional category</option>
                      {categoryOptions.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                  <TextField label="Source keyword" value={recommendationDraft.source_keyword} onChange={(value) => setRecommendationField("source_keyword", value)} placeholder="Optional" />
                  <TextField label="Approximate sales" value={recommendationDraft.approximate_sales} onChange={(value) => setRecommendationField("approximate_sales", value)} placeholder="Optional number" />
                  <div className="md:col-span-2">
                    <TextArea label="Notes" value={recommendationDraft.notes} onChange={(value) => setRecommendationField("notes", value)} placeholder="Optional extra context for reviewers." />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-muted-foreground">Paste a listing, explain why it matters, and submit. Advanced fields help reviewers but are optional.</p>
            <button
              onClick={submitRecommendation}
              disabled={
                !session?.user ||
                !recommendationDraft.product_url.trim() ||
                !recommendationDraft.why_trending.trim() ||
                !recommendationDraft.price_rm.trim()
              }
              className="rounded-lg bg-cyan-500 px-6 py-3 text-sm font-bold text-foreground transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit Recommendation
            </button>
          </div>
        </section>

        <div className="space-y-6">
          {renderContributorSummary()}
          <section className="rounded-xl border border-border bg-card p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <BadgeCheck className="h-5 w-5 text-cyan-300" />
              Approved research leads
            </h3>
            <div className="mt-4 space-y-3">
              {approvedRecommendations.length === 0 ? (
                <EmptyMini text="No approved community recommendations yet." />
              ) : (
                approvedRecommendations.slice(0, 5).map((item) => <RecommendationCard key={item.id} item={item} compact />)
              )}
            </div>
          </section>
        </div>

        {isAdmin && (
          <section className="xl:col-span-2 rounded-xl border border-border bg-card p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground">Admin review queue</h3>
                <p className="mt-1 text-sm text-muted-foreground">Review actions update Supabase recommendation status, contributor profile counters, points, and logs.</p>
              </div>
              <button onClick={loadAdminQueue} className="rounded-lg border border-border px-4 py-2 text-sm font-bold text-foreground transition hover:border-cyan-400">
                Refresh Queue
              </button>
            </div>
            {adminQueue.length === 0 ? (
              <StatePanel title="No pending recommendations" text="Pending and needs-info submissions will appear here for the owner account." />
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {adminQueue.map((item) => renderAdminRecommendation(item))}
              </div>
            )}
          </section>
        )}
      </div>
    );
  }

  function renderLeaderboardSection() {
    return (
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Trophy className="h-6 w-6 text-cyan-300" />
              Contributor leaderboard
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Calculated from Supabase contribution activity and contributor profile records.</p>
          </div>
          <select
            value={leaderboardRange}
            onChange={(event) => setLeaderboardRange(event.target.value)}
            className="rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground outline-none focus:border-cyan-400"
          >
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="all_time">All time</option>
          </select>
        </div>

        {leaderboard.length === 0 ? (
          <StatePanel title="Leaderboard is empty" text="Contributor profiles will appear after users submit recommendations." />
        ) : (
          <div className="space-y-3">
            {leaderboard.map((profile, index) => (
              <div key={profile.id || profile.user_id} className="grid gap-3 rounded-xl border border-border bg-muted/40 p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-lg font-black text-cyan-300">#{index + 1}</div>
                <div>
                  <p className="font-bold text-foreground">{profile.display_name || "Community member"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{profile.current_rank} / {profile.approved_count} approved / {profile.featured_count} featured</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-xl font-bold text-foreground">{profile.total_points}</p>
                  <p className="text-xs text-cyan-300">points</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  function renderMyContributionsSection() {
    if (!session?.user) {
      return <StatePanel title="Sign in required" text="Login to view your recommendations, points, rank, badges, and review history from Supabase." />;
    }

    return (
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1fr]">
        {renderContributorSummary()}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold text-foreground">My contribution activity</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <MiniStat label="Submitted" value={String(myStats.total)} />
            <MiniStat label="Approved" value={String(myStats.approved)} />
            <MiniStat label="Pending" value={String(myStats.pending)} />
          </div>
          <div className="mt-5 space-y-3">
            {activityLogs.length === 0 ? (
              <EmptyMini text="No activity logs yet. Submit a recommendation to create your first Supabase reward event." />
            ) : (
              activityLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-foreground">{log.action.replaceAll("_", " ")}</p>
                    <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-xs font-bold text-cyan-300">
                      {log.points_change >= 0 ? "+" : ""}
                      {log.points_change} pts
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(log.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="xl:col-span-2 rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold text-foreground">My recommendations</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {recommendations.length === 0 ? (
              <div className="lg:col-span-2">
                <StatePanel title="No recommendations yet" text="Your submitted recommendations will persist here after they are saved in Supabase." />
              </div>
            ) : (
              recommendations.map((item) => <RecommendationCard key={item.id} item={item} />)
            )}
          </div>
        </section>
      </div>
    );
  }

  function renderRewardsSection() {
    return (
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Rewards policy</p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">Reputation-based contributor rewards</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Rewards are currently reputation-based and manually reviewed. Future partner or affiliate rewards may be introduced later.
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            ["Contributor badge", "Earn status labels as recommendations are reviewed and approved."],
            ["Priority insights", "High-quality contributors can become eligible for premium research visibility."],
            ["Featured placement", "Top contributors may be highlighted inside the community."],
            ["Monthly recognition", "Leaderboard winners can be recognized as trusted market scouts."],
            ["Manual bonus eligibility", "Future non-automated reward campaigns can use Supabase activity logs."],
            ["Future affiliate eligibility", "The system is prepared for future official reward campaigns without promising cash now."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-xl border border-border bg-muted/40 p-5">
              <Star className="mb-4 h-5 w-5 text-cyan-300" />
              <p className="font-bold text-foreground">{title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-200">
          Product recommendations are reviewed for quality, duplication, and policy compliance. Points do not represent cash value unless a future official reward campaign says otherwise.
        </div>
      </section>
    );
  }

  function renderContributorSummary() {
    const profile = contributorProfile;
    return (
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <Award className="h-5 w-5 text-cyan-300" />
          <div>
            <h3 className="font-bold text-foreground">Contributor status</h3>
            <p className="text-xs text-muted-foreground">Stored in Supabase contributor profiles.</p>
          </div>
        </div>
        {!session?.user ? (
          <EmptyMini text="Sign in to create your contributor profile." />
        ) : !profile ? (
          <EmptyMini text="Start contributing to earn points and unlock contributor badges." />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Points" value={String(profile.total_points)} />
              <MiniStat label="Rank" value={profile.current_rank} />
              <MiniStat label="Submitted" value={String(profile.submitted_count)} />
              <MiniStat label="Approved" value={String(profile.approved_count)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.badges.length === 0 ? (
                <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">No badges yet</span>
              ) : (
                profile.badges.map((badge) => (
                  <span key={badge} className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
                    {badge}
                  </span>
                ))
              )}
            </div>
          </div>
        )}
      </section>
    );
  }

  function renderAdminRecommendation(item: ProductRecommendation) {
    return (
      <div key={item.id} className="rounded-xl border border-border bg-muted/40 p-4">
        <RecommendationCard item={item} compact />
        <textarea
          value={reviewNotes[item.id] || ""}
          onChange={(event) => setReviewNotes((current) => ({ ...current, [item.id]: event.target.value }))}
          placeholder="Admin feedback, rejection reason, or product ops note"
          className="mt-4 min-h-20 w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground outline-none focus:border-cyan-400"
        />
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <ReviewButton icon={CheckCircle2} label="Approve" action="approve" item={item} />
          <ReviewButton icon={XCircle} label="Reject" action="reject" item={item} />
          <ReviewButton icon={AlertCircle} label="Duplicate" action="duplicate" item={item} />
          <ReviewButton icon={MessageCircle} label="Needs Info" action="needs_info" item={item} />
          <ReviewButton icon={Star} label="Feature" action="feature" item={item} />
          <ReviewButton icon={ClipboardList} label="Send Product Ops" action="send_to_product_ops" item={item} />
        </div>
      </div>
    );
  }

  function ReviewButton({ icon: Icon, label, action, item }: { icon: any; label: string; action: ReviewAction; item: ProductRecommendation }) {
    return (
      <button
        onClick={() => reviewRecommendation(item.id, action)}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-foreground transition hover:border-cyan-400"
      >
        <Icon className="h-4 w-4" />
        {label}
      </button>
    );
  }

  function renderPost(post: CommunityPost) {
    const postId = String(post.id);
    const comments = commentsByPost[postId] || [];
    const isLiked = likedPostIds.includes(postId);
    const isSaved = savedPostIds.includes(postId);
    const shownLikes = post.likes + (isLiked ? 1 : 0);
    const shownComments = post.comments + comments.length;

    return (
      <article key={post.id} className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedProfile(post)} className="text-left">
              <Avatar author={post.author} avatarUrl={post.avatarUrl || null} />
            </button>
            <button onClick={() => setSelectedProfile(post)} className="text-left">
              <p className="text-sm font-bold text-foreground">
                {post.author} <span className="ml-2 text-xs font-normal text-cyan-400">{post.role}</span>
              </p>
              <p className="text-xs text-slate-500">{post.time}</p>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {post.isMine && (
              <button onClick={() => deletePost(post)} className="rounded-full p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-300" aria-label="Delete post">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => setSelectedProfile(post)} className="rounded-full p-2 text-slate-500 transition hover:bg-muted hover:text-foreground" aria-label="Post options">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">{post.content}</div>

        <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-border pt-4 text-sm text-muted-foreground">
          <button onClick={() => toggleLike(post)} className={`flex items-center gap-2 transition hover:text-cyan-400 ${isLiked ? "text-cyan-300" : ""}`}>
            <Heart className={`h-4 w-4 ${isLiked ? "fill-cyan-300" : ""}`} /> {shownLikes}
          </button>
          <button onClick={() => setCommentPostId(commentPostId === postId ? null : postId)} className="flex items-center gap-2 transition hover:text-foreground">
            <MessageCircle className="h-4 w-4" /> {shownComments} Comments
          </button>
          <button onClick={() => sharePost(post)} className="flex items-center gap-2 transition hover:text-foreground">
            <Share2 className="h-4 w-4" /> Share
          </button>
          <button onClick={() => followUser(post)} className="flex items-center gap-2 transition hover:text-foreground">
            <Users className="h-4 w-4" /> Follow
          </button>
          <div className="flex-1" />
          <button onClick={() => saveCommunityPostToResearch(post)} className={`flex items-center gap-2 transition hover:text-emerald-400 ${isSaved ? "text-emerald-300" : ""}`}>
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-emerald-300" : ""}`} /> {isSaved ? "Saved" : "Save"}
          </button>
        </div>

        {commentPostId === postId && (
          <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
            {comments.length > 0 ? (
              <div className="mb-4 space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg border border-border bg-card p-3">
                    <p className="text-xs font-bold text-foreground">{comment.author}</p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">{comment.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-4 text-xs text-slate-500">No Supabase comments for this post yet.</p>
            )}
            <div className="flex gap-2">
              <input
                value={commentDrafts[postId] || ""}
                onChange={(event) => setCommentDrafts((current) => ({ ...current, [postId]: event.target.value }))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addComment(post);
                }}
                placeholder="Write a comment..."
                className="min-w-0 flex-1 rounded-lg border border-border bg-input px-4 py-2 text-sm text-foreground outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => addComment(post)}
                disabled={!commentDrafts[postId]?.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-foreground transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Reply
              </button>
            </div>
          </div>
        )}
      </article>
    );
  }

  function renderTelegramCard() {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <Bell className="h-5 w-5 text-cyan-300" />
          <div>
            <h3 className="font-bold text-foreground">Telegram alerts</h3>
            <p className="mt-1 text-xs text-slate-500">Free Telegram bot alerts for community and product signals.</p>
          </div>
        </div>
        <div className="space-y-3">
          <input
            value={telegramChatId}
            onChange={(event) => setTelegramChatId(event.target.value)}
            placeholder="Numeric Telegram chat ID"
            className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground outline-none focus:border-cyan-400"
          />
          <button onClick={findTelegramChats} className="w-full rounded-lg border border-border bg-white/5 px-4 py-3 text-sm font-bold text-foreground transition hover:border-cyan-400">
            Find chat ID
          </button>
          {telegramChats.length > 0 && (
            <div className="space-y-2">
              {telegramChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    setTelegramChatId(chat.id);
                    localStorage.setItem(TELEGRAM_SETTINGS_KEY, JSON.stringify({ chatId: chat.id }));
                  }}
                  className="w-full rounded-lg border border-border bg-muted/50 p-3 text-left text-xs transition hover:border-cyan-400/40"
                >
                  <span className="block font-bold text-foreground">{chat.label}</span>
                  <span className="mt-1 block text-slate-500">{chat.type} / {chat.id}</span>
                </button>
              ))}
            </div>
          )}
          <button onClick={sendTelegramTest} className="w-full rounded-lg bg-cyan-500 px-4 py-3 text-sm font-bold text-foreground transition hover:bg-cyan-300">
            Send test alert
          </button>
          {telegramStatus && <p className="text-xs leading-5 text-cyan-300">{telegramStatus}</p>}
        </div>
      </div>
    );
  }

  function renderTopicFilters() {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 font-bold text-foreground">Topic filters</h3>
        <div className="space-y-3">
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => setActiveTab(topic)}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/40 p-3 text-left transition hover:border-cyan-400/40"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{topic}</p>
                <p className="text-xs text-slate-500">Filtered from real community posts</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function setRecommendationField(key: keyof RecommendationDraft, value: string) {
    setRecommendationDraft((current) => ({ ...current, [key]: value }));
  }
}

function RecommendationCard({ item, compact = false }: { item: ProductRecommendation; compact?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-bold text-foreground">{item.product_name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.platform_found_on} {item.category ? `/ ${item.category}` : ""}
          </p>
        </div>
        <StatusBadge status={item.status} featured={item.featured} />
      </div>
      {!compact && <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.why_trending}</p>}
      <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <span>Price: {item.price_rm ? `RM ${item.price_rm}` : "Pending"}</span>
        <span>Sales: {item.approximate_sales ?? "Pending"}</span>
        <span>Points: {item.points_awarded}</span>
      </div>
      {item.admin_feedback && <p className="mt-3 rounded-lg border border-border bg-card p-3 text-xs leading-5 text-muted-foreground">Admin feedback: {item.admin_feedback}</p>}
      {item.product_url && (
        <a href={item.product_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-cyan-300 hover:text-cyan-200">
          Open source listing <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

function StatusBadge({ status, featured }: { status: string; featured?: boolean }) {
  const isGood = status === "approved" || status === "featured" || status === "sent_to_product_ops";
  const isBad = status === "rejected" || status === "duplicate";
  return (
    <span
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
        featured || isGood
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
          : isBad
            ? "border-red-400/30 bg-red-400/10 text-red-300"
            : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
      }`}
    >
      {formatContributionStatus(featured ? "featured" : status)}
    </span>
  );
}

function loadTelegramSettings() {
  if (typeof window === "undefined") return { chatId: "" };
  try {
    const raw = localStorage.getItem(TELEGRAM_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { chatId: "" };
  } catch {
    return { chatId: "" };
  }
}

function normalizeCloudPost(post: any, currentUserId?: string): CommunityPost {
  return {
    id: String(post.id || crypto.randomUUID()),
    userId: post.userId || post.user_id || null,
    isMine: Boolean(currentUserId && (post.userId || post.user_id) === currentUserId),
    author: String(post.author || "Community member").slice(0, 80),
    role: String(post.role || "Member").slice(0, 80),
    avatarUrl: typeof post.avatarUrl === "string" ? post.avatarUrl : null,
    time: String(post.time || "Just now").slice(0, 40),
    content: String(post.content || "").slice(0, 1200),
    likes: Number(post.likes) || 0,
    comments: Number(post.comments) || 0,
    topic: String(post.topic || "Discussion"),
  };
}

function normalizeContributorProfile(profile: any): ContributorProfile {
  const badges = Array.isArray(profile?.badges) ? profile.badges.map(String) : [];
  return {
    id: String(profile?.id || profile?.user_id || crypto.randomUUID()),
    user_id: String(profile?.user_id || ""),
    display_name: profile?.display_name || null,
    avatar_url: profile?.avatar_url || null,
    total_points: Number(profile?.total_points || 0),
    submitted_count: Number(profile?.submitted_count || 0),
    approved_count: Number(profile?.approved_count || 0),
    rejected_count: Number(profile?.rejected_count || 0),
    duplicate_count: Number(profile?.duplicate_count || 0),
    needs_info_count: Number(profile?.needs_info_count || 0),
    featured_count: Number(profile?.featured_count || 0),
    sent_to_product_ops_count: Number(profile?.sent_to_product_ops_count || 0),
    current_rank: String(profile?.current_rank || "New Scout"),
    badges,
  };
}

function getAuthHeaders(session: Session) {
  return { Authorization: `Bearer ${session.access_token}` };
}

function getCommunityName(session: Session | null) {
  return session?.user?.user_metadata?.display_name || session?.user?.email?.split("@")[0] || "You";
}

function Avatar({ author, avatarUrl, highlight = false }: { author: string; avatarUrl?: string | null; highlight?: boolean }) {
  return (
    <div
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full font-bold ${
        highlight ? "bg-cyan-500/20 text-cyan-400" : "bg-muted text-muted-foreground"
      }`}
    >
      {avatarUrl ? <Image src={avatarUrl} alt={`${author} avatar`} fill unoptimized className="object-cover" /> : author.charAt(0).toUpperCase()}
    </div>
  );
}

function StatePanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
      <p className="text-lg font-bold text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">{text}</p>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-3">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-3 text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder = "",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm text-muted-foreground">
      {label} {required && <span className="text-cyan-300">*</span>}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-border bg-input px-4 py-3 text-foreground outline-none focus:border-cyan-400"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder = "",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm text-muted-foreground">
      {label} {required && <span className="text-cyan-300">*</span>}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-28 rounded-lg border border-border bg-input px-4 py-3 text-foreground outline-none focus:border-cyan-400"
      />
    </label>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatContributionError(error: unknown) {
  const message = error instanceof Error ? error.message : "Contribution program could not be loaded.";
  if (
    message.includes("community_contributor_profiles") ||
    message.includes("community_product_recommendations") ||
    message.includes("community_contribution_activity_logs") ||
    message.toLowerCase().includes("schema cache")
  ) {
    console.warn("Community contribution tables are not ready:", message);
    return "Start contributing to earn points and unlock contributor badges.";
  }
  return message;
}

type CommunityPost = {
  id: number | string;
  userId?: string | null;
  isMine?: boolean;
  author: string;
  role: string;
  avatarUrl?: string | null;
  time: string;
  content: string;
  likes: number;
  comments: number;
  topic?: string;
};

type TelegramChat = {
  id: string;
  label: string;
  type: string;
};

type LocalComment = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

type ContributionActivity = {
  id: string;
  action: string;
  points_change: number;
  created_at: string;
};

type RecommendationDraft = {
  product_name: string;
  platform_found_on: string;
  product_url: string;
  image_url: string;
  category: string;
  price_rm: string;
  approximate_sales: string;
  why_trending: string;
  source_keyword: string;
  notes: string;
};
