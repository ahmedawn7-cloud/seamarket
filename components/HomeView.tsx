"use client";

import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Database,
  Globe2,
  LineChart,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import WaitlistForm from "@/components/WaitlistForm";

const VIDEO_URLS = [
  "https://saxtrrxaaahextpfskuq.supabase.co/storage/v1/object/public/assets/AliExpress_to_Shopee_transition_202606200115.mp4",
  "https://saxtrrxaaahextpfskuq.supabase.co/storage/v1/object/public/assets/E%20commerce.mp4",
  "https://saxtrrxaaahextpfskuq.supabase.co/storage/v1/object/public/assets/UI_dashboard_with_sales_growth_202606200115.mp4",
];

const overviewStats = [
  { label: "Products tracked today", value: "999", hint: "Live product rows", icon: Database },
  { label: "Revenue monitored", value: "RM 3.2M", hint: "Estimated marketplace sales", icon: BarChart3 },
  { label: "Marketplaces covered", value: "3", hint: "TikTok Shop, Shopee, Lazada", icon: Globe2 },
  { label: "AI alerts generated", value: "128", hint: "Trend, margin, and risk signals", icon: Bell },
];

const trendingCategories = ["Beauty", "Modest fashion", "Home tools", "Fitness", "Plant care"];

const marketSnapshot = [
  { label: "Top gaining category", value: "Plant Care & Support", change: "+42.8%" },
  { label: "Fastest growing product", value: "Kalsium Ouli Seeds", change: "+34,212 sales" },
  { label: "Highest ROI niche", value: "Portable beauty tools", change: "3.4x ROI" },
  { label: "Most searched keyword", value: "TikTok viral Malaysia", change: "+18.5%" },
  { label: "Most profitable category", value: "Skincare bundles", change: "RM 41 margin" },
  { label: "Platform activity", value: "TikTok Shop leads", change: "71% of signals" },
];

const timeline = [
  { title: "Product Discovery", icon: Search },
  { title: "Research", icon: Radar },
  { title: "Supplier Comparison", icon: Globe2 },
  { title: "AI Validation", icon: Sparkles },
  { title: "Launch", icon: Zap },
  { title: "Monitor", icon: LineChart },
  { title: "Scale", icon: TrendingUp },
];

const proofStats = [
  { label: "Case studies", value: "18" },
  { label: "Revenue generated", value: "RM 8.4M" },
  { label: "Products tracked", value: "999+" },
  { label: "Countries", value: "6" },
  { label: "Users", value: "1,200+" },
];

const pricingRows = [
  { feature: "Live product radar", guest: "Preview", registered: "100 products", pro: "Full access" },
  { feature: "Market snapshots", guest: "Weekly", registered: "Daily", pro: "Real time" },
  { feature: "AI product research", guest: "-", registered: "Starter prompts", pro: "Deep analysis" },
  { feature: "Supplier comparison", guest: "-", registered: "Limited", pro: "Full workflow" },
  { feature: "Saved watchlist", guest: "-", registered: "10 products", pro: "Unlimited" },
  { feature: "Trend alerts", guest: "-", registered: "Email digest", pro: "Priority alerts" },
];

export default function HomeView({ onExploreProducts }: { onExploreProducts?: () => void }) {
  function scrollToWaitlist() {
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-20 pb-20">
      <section className="grid min-h-[calc(100vh-8rem)] items-center gap-8 py-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-7">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full border border-slate-800 bg-[#0d1322] px-4 py-2">
              <img src="/profit-pilot-logo.png" alt="Profit Pilot AI" className="h-9 w-9 object-contain" />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
                Profit Pilot AI
              </span>
            </div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white md:text-6xl">
              Southeast Asia market intelligence for product operators.
            </h1>
          </div>

          <p className="max-w-2xl text-base leading-7 text-slate-400">
            Monitor demand, margin, suppliers, and marketplace movement from one operating view built for sellers who need evidence before they launch.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onExploreProducts}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Open product radar <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={scrollToWaitlist}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 bg-white/5 px-6 py-3 font-bold text-slate-200 transition hover:border-cyan-400"
            >
              Request intelligence access
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {overviewStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-xl border border-slate-800 bg-[#0d1322] p-4">
                  <Icon className="mb-3 h-5 w-5 text-cyan-300" />
                  <p className="text-[11px] text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-white">{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{stat.hint}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 shadow-2xl shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
                  Today's market overview
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">Live commercial signals</h2>
              </div>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
                Live
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {marketSnapshot.slice(0, 4).map((item) => (
                <div key={item.label} className="rounded-lg border border-slate-800 bg-black/20 p-4">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="mt-2 text-sm font-bold text-white">{item.value}</p>
                  <p className="mt-1 text-xs font-bold text-cyan-300">{item.change}</p>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Trending categories
              </p>
              <div className="flex flex-wrap gap-2">
                {trendingCategories.map((category) => (
                  <span key={category} className="rounded-full border border-slate-700 bg-black/20 px-3 py-1 text-xs text-slate-300">
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <section id="demo-videos" className="grid grid-cols-3 gap-3">
            {VIDEO_URLS.map((url, index) => (
              <div key={url} className="h-40 overflow-hidden rounded-xl border border-slate-800 bg-black shadow-xl transition hover:border-cyan-400/50 md:h-56">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className={`h-full w-full object-cover ${
                    index === 1 ? "scale-125" : "scale-110"
                  }`}
                >
                  <source src={url} type="video/mp4" />
                </video>
              </div>
            ))}
          </section>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
            Live Market Snapshot
          </p>
          <h2 className="mt-2 text-3xl font-bold text-white">What moved in the market today</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {marketSnapshot.map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-800 bg-[#0d1322] p-5">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="mt-3 text-lg font-bold text-white">{item.value}</p>
                <p className="mt-2 text-sm font-bold text-cyan-300">{item.change}</p>
              </div>
            ))}
          </div>

          <AnimatedDashboardPreview />
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
            Operating System
          </p>
          <h2 className="mt-2 text-3xl font-bold text-white">From signal to scale</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-7">
          {timeline.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="flex flex-col items-center gap-3">
                <div className="flex w-full items-center gap-3">
                  <div className="flex h-16 flex-1 flex-col items-center justify-center rounded-xl border border-slate-800 bg-[#0d1322] px-3 text-center">
                    <Icon className="mb-2 h-5 w-5 text-cyan-300" />
                    <p className="text-xs font-bold text-white">{step.title}</p>
                  </div>
                  {index < timeline.length - 1 && (
                    <ArrowDown className="hidden h-4 w-4 shrink-0 rotate-[-90deg] text-slate-600 md:block" />
                  )}
                </div>
                {index < timeline.length - 1 && <ArrowDown className="h-4 w-4 text-slate-600 md:hidden" />}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-[#0d1322] p-6">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
              Business Proof
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white">Built for measurable product decisions</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Product operators use Profit Pilot AI to compare demand, avoid saturated categories, and validate supplier economics before ad spend.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {proofStats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-slate-800 bg-black/20 p-4">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="mt-2 text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
              Access Plans
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white">Compare intelligence coverage</h2>
          </div>
          <button
            onClick={scrollToWaitlist}
            className="inline-flex items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-bold text-cyan-200 transition hover:bg-cyan-400/20"
          >
            Join waitlist
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0d1322]">
          <div className="grid grid-cols-[1.2fr_repeat(3,0.8fr)] border-b border-slate-800 bg-black/20">
            {["Feature", "Guest", "Registered", "Pro"].map((heading) => (
              <div key={heading} className="p-4 text-sm font-bold text-white">
                {heading}
              </div>
            ))}
          </div>
          {pricingRows.map((row) => (
            <div key={row.feature} className="grid grid-cols-[1.2fr_repeat(3,0.8fr)] border-b border-slate-800 last:border-b-0">
              <div className="p-4 text-sm text-slate-300">{row.feature}</div>
              <PlanCell value={row.guest} />
              <PlanCell value={row.registered} />
              <PlanCell value={row.pro} emphasis />
            </div>
          ))}
        </div>
      </section>

      <section id="waitlist" className="scroll-mt-24 border-t border-slate-800/80 pt-16">
        <WaitlistForm />
      </section>
    </div>
  );
}

function AnimatedDashboardPreview() {
  const bars = [38, 54, 45, 72, 66, 88, 79, 94];

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 shadow-2xl shadow-black/30">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
            Command Preview
          </p>
          <h3 className="mt-2 text-xl font-bold text-white">Market activity engine</h3>
        </div>
        <ShieldCheck className="h-6 w-6 text-cyan-300" />
      </div>

      <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-3">
          {["TikTok velocity", "Supplier risk", "Margin stability", "Launch readiness"].map((label, index) => (
            <div key={label} className="rounded-lg border border-slate-800 bg-black/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">{label}</span>
                <span className="text-xs font-bold text-cyan-300">{82 - index * 7}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-400 transition-all duration-700"
                  style={{ width: `${82 - index * 7}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-slate-800 bg-black/20 p-4">
          <div className="flex h-52 items-end gap-3">
            {bars.map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-cyan-400/80 shadow-lg shadow-cyan-500/10 transition-all duration-700"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] text-slate-600">{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanCell({ value, emphasis = false }: { value: string; emphasis?: boolean }) {
  const included = value !== "-";

  return (
    <div className={`flex items-center gap-2 p-4 text-sm ${emphasis ? "text-cyan-200" : "text-slate-300"}`}>
      {included ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-300" />
      ) : (
        <span className="h-4 w-4 shrink-0 text-center text-slate-600">-</span>
      )}
      <span>{value}</span>
    </div>
  );
}
