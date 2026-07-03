"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send, Star, Users } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
const LOCAL_POSTS_KEY = "profitpilot-local-community-posts";
const LOCAL_PROFILE_KEY = "profitpilot-local-profile";

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
  const [localProfile, setLocalProfile] = useState<LocalProfile | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<CommunityPost | null>(null);

  useEffect(() => {
    const profile = loadLocalProfile();
    setLocalProfile(profile);

    const localPosts = loadLocalPosts();
    if (localPosts.length > 0) {
      setPosts([...hydrateLocalPosts(localPosts, profile), ...mockPosts]);
    }
  }, []);

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
    saveLocalPost(newPost);
    setPostText("");
    setPostStatus("Posted and saved locally.");

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
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Community Hub</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Connect, share, and grow with other sellers.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-800 bg-[#0d1322] p-5">
            <div className="flex gap-4">
              <Avatar author={getCommunityName(session, localProfile)} avatarUrl={localProfile?.avatarPreview || null} highlight />
              <div className="flex-1 space-y-3">
                <input 
                  value={postText}
                  onChange={(event) => setPostText(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-[#070b16] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400" 
                  placeholder="What's on your mind? Share a product or ask a question..." 
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {["All", "Discussion", "Questions", "Wins", "News"].map(tab => (
                      <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-full px-4 py-1 text-xs font-medium transition ${activeTab === tab ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30" : "bg-black/30 text-slate-400 border border-slate-700"}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={createPost}
                    className="rounded-lg bg-cyan-500 px-6 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                  >
                    Post
                  </button>
                </div>
                {postStatus && <p className="text-xs text-cyan-300">{postStatus}</p>}
              </div>
            </div>
          </section>

          <div className="space-y-4">
            {posts.map((post) => (
              <article key={post.id} className="rounded-xl border border-slate-800 bg-[#0d1322] p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedProfile(post)} className="text-left">
                      <Avatar author={post.author} avatarUrl={post.avatarUrl || null} />
                    </button>
                    <button onClick={() => setSelectedProfile(post)} className="text-left">
                      <p className="text-sm font-bold text-white">{post.author} <span className="text-xs font-normal text-cyan-400 ml-2">{post.role}</span></p>
                      <p className="text-xs text-slate-500">{post.time}</p>
                    </button>
                  </div>
                  <button className="text-slate-500 hover:text-white">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 text-sm leading-6 text-slate-300 whitespace-pre-line">
                  {post.content}
                </div>

                {post.rating > 0 && (
                  <div className="mt-3 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className={`h-4 w-4 ${star <= post.rating ? "text-amber-400 fill-amber-400" : "text-slate-700"}`} />
                    ))}
                    <span className="text-xs text-slate-400 ml-2">Product Rating</span>
                  </div>
                )}

                {post.images && (
                  <div className="mt-4 h-48 w-full max-w-sm overflow-hidden rounded-lg border border-slate-700">
                    <img src={post.images[0]} alt="Post attachment" className="h-full w-full object-cover" />
                  </div>
                )}

                <div className="mt-5 flex items-center gap-6 border-t border-slate-800 pt-4 text-sm text-slate-400">
                  <button className="flex items-center gap-2 transition hover:text-cyan-400">
                    <Heart className="h-4 w-4" /> {post.likes}
                  </button>
                  <button className="flex items-center gap-2 transition hover:text-white">
                    <MessageCircle className="h-4 w-4" /> {post.comments} Comments
                  </button>
                  <div className="flex-1"></div>
                  <button className="flex items-center gap-2 transition hover:text-emerald-400">
                    <Bookmark className="h-4 w-4" /> Save
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5">
            <h3 className="font-bold text-white mb-4">Trending Topics</h3>
            <div className="space-y-4">
              {topics.map(topic => (
                <div key={topic.name} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-black/30 flex items-center justify-center text-slate-400">
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
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0d1322] p-6 shadow-2xl shadow-black/40">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar author={selectedProfile.author} avatarUrl={selectedProfile.avatarUrl || null} />
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedProfile.author}</h2>
                  <p className="text-sm text-cyan-300">{selectedProfile.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedProfile(null)} className="text-slate-500 hover:text-white">
                Close
              </button>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <ProfileStat label="Posts" value={selectedProfile.isMine ? "Local" : "Public"} />
              <ProfileStat label="Likes" value={String(selectedProfile.likes)} />
              <ProfileStat label="Comments" value={String(selectedProfile.comments)} />
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-400">
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

function loadLocalPosts() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_POSTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
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

function getCommunityName(session: Session | null, profile: LocalProfile | null) {
  return profile?.displayName?.trim() || session?.user?.email?.split("@")[0] || "You";
}

function saveLocalPost(post: {
  id: number;
  isMine?: boolean;
  author: string;
  role: string;
  avatarUrl?: string | null;
  time: string;
  content: string;
  likes: number;
  comments: number;
  rating: number;
}) {
  if (typeof window === "undefined") return;
  const existing = loadLocalPosts();
  localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify([post, ...existing].slice(0, 50)));
}

function Avatar({ author, avatarUrl, highlight = false }: { author: string; avatarUrl?: string | null; highlight?: boolean }) {
  return (
    <div
      className={`h-10 w-10 shrink-0 overflow-hidden rounded-full ${
        highlight ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-800 text-slate-400"
      } flex items-center justify-center font-bold`}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={`${author} avatar`} className="h-full w-full object-cover" />
      ) : (
        author.charAt(0).toUpperCase()
      )}
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-black/20 p-3 text-center">
      <p className="text-lg font-bold text-white">{value}</p>
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
  id: number;
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
