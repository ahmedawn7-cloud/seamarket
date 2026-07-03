"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { Bell, Bookmark, Heart, MessageCircle, MoreHorizontal, Send, Share2, Star, Trash2, Users } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
const LOCAL_POSTS_KEY = "profitpilot-local-community-posts";
const LOCAL_PROFILE_KEY = "profitpilot-local-profile";
const TELEGRAM_SETTINGS_KEY = "profitpilot-telegram-settings";
const LOCAL_COMMUNITY_ACTIONS_KEY = "profitpilot-community-actions";
const MAX_LOCAL_POSTS = 20;

const mockPosts: CommunityPost[] = [
  {
    id: 1,
    author: "Sarah Lee",
    role: "Pro Seller",
    time: "2 hours ago",
    content: "Just tested this waist support belt and it's performing really well! 🔥\n\nHere are my results after 7 days of running TikTok ads. Anyone else seeing this trend?",
    likes: 124,
    comments: 45,
    rating: 5,
    images: ["https://saxtrrxaaahextpfskuq.supabase.co/storage/v1/object/public/assets/Tali%20Pinggang.jpg"],
  },
  {
    id: 2,
    author: "Ahmad Zaki",
    role: "New Seller",
    time: "5 hours ago",
    content: "Is anyone else having issues with logistics delays from China this week? My CJ Dropshipping orders are taking 5 days just to process.",
    likes: 32,
    comments: 89,
    rating: 0,
  },
  {
    id: 3,
    author: "Mei Ling",
    role: "Agency",
    time: "1 day ago",
    content: "Product Teardown: Why this mini portable blender is dominating Shopee right now. I've broken down their pricing strategy and bundle offers.",
    likes: 342,
    comments: 112,
    rating: 4.5,
  }
];

const topics = [
  { name: "Shopee trends", posts: "1.2k posts" },
  { name: "TikTok Shop testing", posts: "84 posts" },
  { name: "Supplier checks", posts: "56 posts" },
  { name: "Malaysia logistics", posts: "41 posts" },
];

export default function CommunityHub({ session }: { session: Session | null }) {
  const [activeTab, setActiveTab] = useState("All");
  const [postText, setPostText] = useState("");
  const [posts, setPosts] = useState<CommunityPost[]>(mockPosts);
  const [postStatus, setPostStatus] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramStatus, setTelegramStatus] = useState("");
  const [telegramChats, setTelegramChats] = useState<TelegramChat[]>([]);
  const [localProfile, setLocalProfile] = useState<LocalProfile | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<CommunityPost | null>(null);
  const [sharedStatus, setSharedStatus] = useState("");
  const [commentPostId, setCommentPostId] = useState<string | number | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [actions, setActions] = useState<CommunityActions>(() => loadCommunityActions());

  useEffect(() => {
    const profile = loadLocalProfile();
    const telegram = loadTelegramSettings();
    setLocalProfile(profile);
    setTelegramChatId(telegram.chatId || "");
    setActions(loadCommunityActions());

    const localPosts = loadLocalPosts();
    setPosts(mergePosts([], hydrateLocalPosts(localPosts, profile), mockPosts));
    loadSharedPosts(profile);
  }, [session?.user?.id]);

  async function loadSharedPosts(profile = localProfile) {
    try {
      const response = await fetch("/api/community/posts", { cache: "no-store" });
      const payload = await response.json();
      const latestLocalPosts = loadLocalPosts();

      if (!payload.ok) {
        setSharedStatus(`Cloud community is not ready yet: ${payload.error}`);
        setPosts(mergePosts([], hydrateLocalPosts(latestLocalPosts, profile), mockPosts));
        return;
      }

      const cloudPosts = Array.isArray(payload.posts) ? payload.posts.map((post: any) => normalizeCloudPost(post, session?.user?.id)) : [];
      setPosts(mergePosts(cloudPosts, hydrateLocalPosts(latestLocalPosts, profile), mockPosts));
      setSharedStatus(cloudPosts.length > 0 ? "Showing shared Supabase community posts." : "No shared posts yet. Be the first to post.");
    } catch (error) {
      setSharedStatus(error instanceof Error ? `Community sync failed: ${error.message}` : "Community sync failed.");
      setPosts(mergePosts([], hydrateLocalPosts(loadLocalPosts(), profile), mockPosts));
    }
  }

  async function createPost() {
    const content = postText.trim();
    if (!content) {
      setPostStatus("Write something before posting.");
      return;
    }

    const newPost = {
      id: Date.now(),
      isMine: true,
      author: getCommunityName(session, localProfile),
      role: localProfile?.businessType || "Member",
      avatarUrl: localProfile?.avatarPreview || null,
      time: "Just now",
      content,
      likes: 0,
      comments: 0,
      rating: 0,
    };

    setPosts((current) => [newPost, ...current]);
    const savedLocally = saveLocalPost(newPost);
    setPostText("");
    setPostStatus(
      savedLocally
        ? "Posted and saved locally."
        : "Posted for this session. Local browser storage is full, so older local posts were trimmed.",
    );

    if (!supabase || !session?.user) return;

    const { error } = await supabase.from("community_posts").insert({
      user_id: session.user.id,
      title: content.slice(0, 80),
      body: content,
    });

    setPostStatus(
      error
        ? `Saved locally. Supabase cloud save needs community_posts setup: ${error.message}`
        : "Posted and saved to Supabase.",
    );

    if (!error) {
      loadSharedPosts(localProfile);
    }
  }

  function updateActions(updater: (current: CommunityActions) => CommunityActions) {
    setActions((current) => {
      const next = updater(current);
      saveCommunityActions(next);
      return next;
    });
  }

  function toggleLike(post: CommunityPost) {
    const postId = String(post.id);

    updateActions((current) => {
      const likedPostIds = new Set(current.likedPostIds);
      if (likedPostIds.has(postId)) {
        likedPostIds.delete(postId);
      } else {
        likedPostIds.add(postId);
      }
      return { ...current, likedPostIds: Array.from(likedPostIds) };
    });
  }

  function addComment(post: CommunityPost) {
    const postId = String(post.id);
    const body = (commentDrafts[postId] || "").trim();
    if (!body) return;

    updateActions((current) => ({
      ...current,
      commentsByPost: {
        ...current.commentsByPost,
        [postId]: [
          ...(current.commentsByPost[postId] || []),
          {
            id: Date.now(),
            author: getCommunityName(session, localProfile),
            body,
            createdAt: new Date().toISOString(),
          },
        ].slice(-20),
      },
    }));
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
    setCommentPostId(postId);
    setPostStatus("Comment added.");
  }

  function saveCommunityPostToResearch(post: CommunityPost) {
    const postId = String(post.id);
    const researchKey = getResearchStorageKey(session);
    const workspace = loadResearchWorkspace(researchKey);
    const savedCommunityPosts = Array.isArray(workspace.savedCommunityPosts) ? workspace.savedCommunityPosts : [];
    const nextPosts = [
      {
        id: postId,
        author: post.author,
        role: post.role,
        content: post.content,
        savedAt: new Date().toISOString(),
        source: "Community Hub",
      },
      ...savedCommunityPosts.filter((item: SavedCommunityPost) => String(item.id) !== postId),
    ].slice(0, 30);

    saveResearchWorkspace(researchKey, { ...workspace, savedCommunityPosts: nextPosts });
    updateActions((current) => ({
      ...current,
      savedPostIds: Array.from(new Set([...current.savedPostIds, postId])),
    }));
    setPostStatus("Saved to Research Hub.");
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

    setPosts((current) => current.filter((item) => String(item.id) !== String(post.id)));
    removeLocalPost(post.id);
    setPostStatus("Post deleted.");

    if (!supabase || !session?.user || !post.userId) return;

    const { error } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", post.id)
      .eq("user_id", session.user.id);

    if (error) {
      setPostStatus(`Deleted locally. Cloud delete failed: ${error.message}`);
    }
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Community Hub</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Connect, share, and grow with other sellers.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex gap-4">
              <Avatar author={getCommunityName(session, localProfile)} avatarUrl={localProfile?.avatarPreview || null} highlight />
              <div className="flex-1 space-y-3">
                <input 
                  value={postText}
                  onChange={(event) => setPostText(event.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground outline-none focus:border-cyan-400" 
                  placeholder="What's on your mind? Share a product or ask a question..." 
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {["All", "Discussion", "Questions", "Wins", "News"].map(tab => (
                      <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-full px-4 py-1 text-xs font-medium transition ${activeTab === tab ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30" : "bg-muted text-muted-foreground border border-border"}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={createPost}
                    className="rounded-lg bg-cyan-500 px-6 py-2 text-sm font-bold text-foreground transition hover:bg-cyan-300"
                  >
                    Post
                  </button>
                </div>
                {(postStatus || sharedStatus) && (
                  <p className="text-xs text-cyan-300">{postStatus || sharedStatus}</p>
                )}
              </div>
            </div>
          </section>

          <div className="space-y-4">
            {posts.map((post) => {
              const postId = String(post.id);
              const localComments = actions.commentsByPost[postId] || [];
              const isLiked = actions.likedPostIds.includes(postId);
              const isSaved = actions.savedPostIds.includes(postId);
              const shownLikes = post.likes + (isLiked ? 1 : 0);
              const shownComments = post.comments + localComments.length;

              return (
              <article key={post.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedProfile(post)} className="text-left">
                      <Avatar author={post.author} avatarUrl={post.avatarUrl || null} />
                    </button>
                    <button onClick={() => setSelectedProfile(post)} className="text-left">
                      <p className="text-sm font-bold text-foreground">{post.author} <span className="text-xs font-normal text-cyan-400 ml-2">{post.role}</span></p>
                      <p className="text-xs text-slate-500">{post.time}</p>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.isMine && (
                      <button
                        onClick={() => deletePost(post)}
                        className="rounded-full p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-300"
                        aria-label="Delete post"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => setSelectedProfile(post)} className="rounded-full p-2 text-slate-500 transition hover:bg-muted hover:text-foreground" aria-label="Post options">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 text-sm leading-6 text-muted-foreground whitespace-pre-line">
                  {post.content}
                </div>

                {post.rating > 0 && (
                  <div className="mt-3 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className={`h-4 w-4 ${star <= post.rating ? "text-amber-400 fill-amber-400" : "text-slate-700"}`} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-2">Product Rating</span>
                  </div>
                )}

                {post.images && (
                  <div className="relative mt-4 h-48 w-full max-w-sm overflow-hidden rounded-lg border border-border">
                    <Image src={post.images[0]} alt="Post attachment" fill unoptimized className="object-cover" />
                  </div>
                )}

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
                  <div className="flex-1"></div>
                  <button onClick={() => saveCommunityPostToResearch(post)} className={`flex items-center gap-2 transition hover:text-emerald-400 ${isSaved ? "text-emerald-300" : ""}`}>
                    <Bookmark className={`h-4 w-4 ${isSaved ? "fill-emerald-300" : ""}`} /> {isSaved ? "Saved" : "Save"}
                  </button>
                </div>

                {commentPostId === postId && (
                  <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
                    {localComments.length > 0 && (
                      <div className="mb-4 space-y-3">
                        {localComments.map((comment) => (
                          <div key={comment.id} className="rounded-lg border border-border bg-card p-3">
                            <p className="text-xs font-bold text-foreground">{comment.author}</p>
                            <p className="mt-1 text-sm leading-5 text-muted-foreground">{comment.body}</p>
                          </div>
                        ))}
                      </div>
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
                        className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-foreground transition hover:bg-cyan-300"
                      >
                        <Send className="h-4 w-4" />
                        Reply
                      </button>
                    </div>
                  </div>
                )}
              </article>
            )})}
          </div>
        </div>

        <div className="space-y-6">
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
              <p className="text-xs leading-5 text-slate-500">
                Use a numeric chat ID, not a personal @username. First message your Telegram bot, then click Find chat ID.
              </p>
              <button
                onClick={findTelegramChats}
                className="w-full rounded-lg border border-border bg-white/5 px-4 py-3 text-sm font-bold text-foreground transition hover:border-cyan-400"
              >
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
              <button
                onClick={sendTelegramTest}
                className="w-full rounded-lg bg-cyan-500 px-4 py-3 text-sm font-bold text-foreground transition hover:bg-cyan-300"
              >
                Send test alert
              </button>
              {telegramStatus && <p className="text-xs leading-5 text-cyan-300">{telegramStatus}</p>}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-bold text-foreground mb-4">Trending Topics</h3>
            <div className="space-y-4">
              {topics.map(topic => (
                <div key={topic.name} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{topic.name}</p>
                    <p className="text-xs text-slate-500">{topic.posts}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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
              <ProfileStat label="Posts" value={selectedProfile.isMine ? "Local" : "Public"} />
              <ProfileStat label="Likes" value={String(selectedProfile.likes)} />
              <ProfileStat label="Comments" value={String(selectedProfile.comments)} />
            </div>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              {selectedProfile.isMine
                ? "This is your local community profile. It uses the photo and details saved in User Dashboard."
                : "Public seller profile preview. Full user pages can be connected once Supabase profile tables are active."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function loadLocalPosts(): CommunityPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_POSTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(sanitizeLocalPost).filter(isCommunityPost) : [];
  } catch {
    localStorage.removeItem(LOCAL_POSTS_KEY);
    return [];
  }
}

function loadLocalProfile(): LocalProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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

function loadCommunityActions(): CommunityActions {
  if (typeof window === "undefined") return { likedPostIds: [], savedPostIds: [], commentsByPost: {} };
  try {
    const raw = localStorage.getItem(LOCAL_COMMUNITY_ACTIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      likedPostIds: Array.isArray(parsed.likedPostIds) ? parsed.likedPostIds.map(String) : [],
      savedPostIds: Array.isArray(parsed.savedPostIds) ? parsed.savedPostIds.map(String) : [],
      commentsByPost: parsed.commentsByPost && typeof parsed.commentsByPost === "object" ? parsed.commentsByPost : {},
    };
  } catch {
    return { likedPostIds: [], savedPostIds: [], commentsByPost: {} };
  }
}

function saveCommunityActions(actions: CommunityActions) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_COMMUNITY_ACTIONS_KEY, JSON.stringify(actions));
  } catch {
    localStorage.setItem(
      LOCAL_COMMUNITY_ACTIONS_KEY,
      JSON.stringify({
        likedPostIds: actions.likedPostIds.slice(-50),
        savedPostIds: actions.savedPostIds.slice(-50),
        commentsByPost: {},
      }),
    );
  }
}

function getResearchStorageKey(session: Session | null) {
  return `profitpilot-research-${session?.user?.email?.toLowerCase() || "local"}`;
}

function loadResearchWorkspace(key: string): ResearchWorkspace {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveResearchWorkspace(key: string, workspace: ResearchWorkspace) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(workspace));
  } catch {
    localStorage.setItem(
      key,
      JSON.stringify({
        ...workspace,
        savedCommunityPosts: workspace.savedCommunityPosts?.slice(0, 10),
      }),
    );
  }
}

function hydrateLocalPosts(posts: CommunityPost[], profile: LocalProfile | null) {
  return posts.map((post) =>
    post.isMine
      ? {
          ...post,
          author: profile?.displayName || post.author,
          role: profile?.businessType || post.role,
          avatarUrl: profile?.avatarPreview || post.avatarUrl || null,
        }
      : post,
  );
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
    rating: Number(post.rating) || 0,
  };
}

function mergePosts(...groups: CommunityPost[][]) {
  const seen = new Set<string>();
  const merged: CommunityPost[] = [];

  for (const post of groups.flat()) {
    const key = String(post.id);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(post);
  }

  return merged;
}

function getCommunityName(session: Session | null, profile: LocalProfile | null) {
  return profile?.displayName?.trim() || session?.user?.email?.split("@")[0] || "You";
}

function saveLocalPost(post: CommunityPost) {
  if (typeof window === "undefined") return false;
  const existing = loadLocalPosts();
  const posts = [sanitizeLocalPost(post), ...existing].filter(Boolean) as CommunityPost[];

  for (const limit of [MAX_LOCAL_POSTS, 10, 5, 1]) {
    try {
      localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts.slice(0, limit)));
      return true;
    } catch (error) {
      if (!isStorageQuotaError(error)) {
        return false;
      }
    }
  }

  try {
    localStorage.removeItem(LOCAL_POSTS_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }

  return false;
}

function removeLocalPost(postId: number | string) {
  if (typeof window === "undefined") return;
  const nextPosts = loadLocalPosts().filter((post) => String(post.id) !== String(postId));
  try {
    localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(nextPosts));
  } catch {
    localStorage.removeItem(LOCAL_POSTS_KEY);
  }
}

function sanitizeLocalPost(post: any): CommunityPost | null {
  if (!post || typeof post !== "object") return null;

  return {
    id: typeof post.id === "string" ? post.id.slice(0, 80) : Number(post.id) || Date.now(),
    userId: typeof post.userId === "string" ? post.userId : null,
    isMine: Boolean(post.isMine),
    author: String(post.author || "You").slice(0, 80),
    role: String(post.role || "Member").slice(0, 80),
    avatarUrl: post.isMine ? null : typeof post.avatarUrl === "string" && !post.avatarUrl.startsWith("data:") ? post.avatarUrl : null,
    time: String(post.time || "Just now").slice(0, 40),
    content: String(post.content || "").slice(0, 1200),
    likes: Number(post.likes) || 0,
    comments: Number(post.comments) || 0,
    rating: Number(post.rating) || 0,
  };
}

function isCommunityPost(post: CommunityPost | null): post is CommunityPost {
  return Boolean(post);
}

function isStorageQuotaError(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22 ||
      error.code === 1014)
  );
}

function Avatar({ author, avatarUrl, highlight = false }: { author: string; avatarUrl?: string | null; highlight?: boolean }) {
  return (
    <div
      className={`h-10 w-10 shrink-0 overflow-hidden rounded-full ${
        highlight ? "bg-cyan-500/20 text-cyan-400" : "bg-muted text-muted-foreground"
      } relative overflow-hidden flex items-center justify-center font-bold`}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt={`${author} avatar`} fill unoptimized className="object-cover" />
      ) : (
        author.charAt(0).toUpperCase()
      )}
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

type LocalProfile = {
  displayName?: string;
  businessType?: string;
  country?: string;
  avatarPreview?: string | null;
};

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
  rating: number;
  images?: string[];
};

type TelegramChat = {
  id: string;
  label: string;
  type: string;
};

type LocalComment = {
  id: number;
  author: string;
  body: string;
  createdAt: string;
};

type CommunityActions = {
  likedPostIds: string[];
  savedPostIds: string[];
  commentsByPost: Record<string, LocalComment[]>;
};

type SavedCommunityPost = {
  id: string;
  author: string;
  role: string;
  content: string;
  savedAt: string;
  source: string;
};

type ResearchWorkspace = {
  savedCommunityPosts?: SavedCommunityPost[];
  [key: string]: unknown;
};
