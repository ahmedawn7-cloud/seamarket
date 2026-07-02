"use client";

import { useState } from "react";
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send, Star, Users } from "lucide-react";

const mockPosts = [
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

export default function CommunityHub() {
  const [activeTab, setActiveTab] = useState("All");

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
              <div className="h-10 w-10 shrink-0 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                Me
              </div>
              <div className="flex-1 space-y-3">
                <input 
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
                  <button className="rounded-lg bg-cyan-500 px-6 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
                    Post
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="space-y-4">
            {mockPosts.map((post) => (
              <article key={post.id} className="rounded-xl border border-slate-800 bg-[#0d1322] p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                      {post.author.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{post.author} <span className="text-xs font-normal text-cyan-400 ml-2">{post.role}</span></p>
                      <p className="text-xs text-slate-500">{post.time}</p>
                    </div>
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
    </div>
  );
}