"use client";

import { CalendarDays, MessageCircle, Newspaper, Send, Users } from "lucide-react";

const topics = [
  { name: "Shopee trends", posts: 128 },
  { name: "TikTok Shop testing", posts: 84 },
  { name: "Supplier checks", posts: 56 },
  { name: "Malaysia logistics", posts: 41 },
];

const groups = [
  "New seller circle",
  "TikTok product testers",
  "Cross-border sourcing",
  "AI research workflows",
];

const events = [
  { title: "Weekly product teardown", date: "Friday, 8:00 PM" },
  { title: "Supplier due diligence clinic", date: "Sunday, 3:00 PM" },
];

const news = [
  "Marketplace policy changes and fee updates will appear here.",
  "Auto-generated platform news can be connected after the site foundation is stable.",
  "Community posts can later award points in the user dashboard.",
];

export default function CommunityHub() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Community</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Topics, groups, events, and seller signals</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Build a community around shared product discovery, sourcing lessons, and marketplace changes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <section className="rounded-xl border border-slate-800 bg-[#0d1322] p-6">
          <div className="mb-5 flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-cyan-300" />
            <h2 className="text-xl font-bold text-white">Discussion topics</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {topics.map((topic) => (
              <button key={topic.name} className="rounded-xl border border-slate-800 bg-black/20 p-4 text-left transition hover:border-cyan-400/60">
                <p className="font-bold text-white">{topic.name}</p>
                <p className="mt-1 text-sm text-slate-500">{topic.posts} posts</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-[#0d1322] p-6">
          <div className="mb-5 flex items-center gap-3">
            <Send className="h-5 w-5 text-emerald-300" />
            <h2 className="text-xl font-bold text-white">Start a post</h2>
          </div>
          <div className="space-y-3">
            <input className="w-full rounded-lg border border-slate-700 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-400" placeholder="Post title" />
            <textarea className="h-28 w-full resize-none rounded-lg border border-slate-700 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-400" placeholder="Share product insight, platform news, or sourcing lesson..." />
            <button className="w-full rounded-lg bg-cyan-500 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300">
              Publish later
            </button>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel icon={Users} title="Groups">
          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group} className="rounded-lg border border-slate-800 bg-black/20 p-3 text-sm font-bold text-white">
                {group}
              </div>
            ))}
          </div>
        </Panel>

        <Panel icon={CalendarDays} title="Events">
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.title} className="rounded-lg border border-slate-800 bg-black/20 p-3">
                <p className="font-bold text-white">{event.title}</p>
                <p className="mt-1 text-sm text-slate-500">{event.date}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel icon={Newspaper} title="Platform news">
          <div className="space-y-3">
            {news.map((item) => (
              <div key={item} className="rounded-lg border border-slate-800 bg-black/20 p-3 text-sm leading-6 text-slate-400">
                {item}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-[#0d1322] p-6">
      <div className="mb-5 flex items-center gap-3">
        <Icon className="h-5 w-5 text-cyan-300" />
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}