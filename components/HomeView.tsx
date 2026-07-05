"use client";

import Image from "next/image";
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
import SeasonalSalesRadar from "@/components/seasonal/SeasonalSalesRadar";

const VIDEO_URLS = [
  "https://saxtrrxaaahextpfskuq.supabase.co/storage/v1/object/public/assets/AliExpress_to_Shopee_transition_202606200115.mp4",
  "https://saxtrrxaaahextpfskuq.supabase.co/storage/v1/object/public/assets/E%20commerce.mp4",
  "https://saxtrrxaaahextpfskuq.supabase.co/storage/v1/object/public/assets/UI_dashboard_with_sales_growth_202606200115.mp4",
];

const overviewStats = [
  { label: "Products tracked today", value: "Live", hint: "Loaded in Product Radar", icon: Database },
  { label: "Revenue monitored", value: "Pending", hint: "Requires Revenue_Calc coverage", icon: BarChart3 },
  { label: "Marketplaces covered", value: "3", hint: "TikTok Shop, Shopee, Lazada", icon: Globe2 },
  { label: "AI alerts generated", value: "Pending", hint: "Requires alert history", icon: Bell },
];

const trendingCategories = ["Beauty", "Modest fashion", "Home tools", "Fitness", "Plant care"];

const marketSnapshot = [
  { label: "Top gaining category", value: "Plant Care & Support", change: "From live product rows" },
  { label: "Fastest growing product", value: "Kalsium Ouli Seeds", change: "From sales field" },
  { label: "Highest ROI niche", value: "Data pending", change: "Needs ROI_Calc coverage" },
  { label: "Most searched keyword", value: "Data pending", change: "Needs search logs" },
  { label: "Most profitable category", value: "Data pending", change: "Needs Net_Margin_Calc" },
  { label: "Platform activity", value: "Connected", change: "Based on source URLs" },
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
  { label: "Case studies", value: "Pending" },
  { label: "Revenue generated", value: "Pending" },
  { label: "Products tracked", value: "Live" },
  { label: "Countries", value: "Malaysia-first" },
  { label: "Users", value: "Waitlist" },
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
    <div className="dark-theme space-y-20 pb-20">
      <section className="grid min-h-[calc(100vh-8rem)] items-center gap-8 py-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-7">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2">
              <Image src="/profit-pilot-logo.png" alt="Profit Pilot AI" width={36} height={36} className="h-9 w-9 object-contain" />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
                Profit Pilot AI
              </span>
            </div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Southeast Asia market intelligence for product operators.
            </h1>
          </div>

          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Monitor demand, margin, suppliers, and marketplace movement from one operating view built for sellers who need evidence before they launch.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onExploreProducts}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-500 px-6 py-3 font-bold text-foreground transition hover:bg-cyan-300"
            >
              Open product radar <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={scrollToWaitlist}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white/5 px-6 py-3 font-bold text-slate-200 transition hover:border-cyan-400"
            >
              Request intelligence access
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {overviewStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-cyan-400/30">
                  <Icon className="mb-3 h-5 w-5 text-cyan-300" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <SeasonalSalesRadar onExplore={onExploreProducts} />
        </div>
      </section>

      <section id="demo-videos" className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-3">
        {VIDEO_URLS.map((url, index) => (
          <div key={url} className="h-48 overflow-hidden rounded-xl border border-border bg-black shadow-xl transition hover:border-cyan-400/50 md:h-64">
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

      <section className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
            Live Market Snapshot
          </p>
          <h2 className="mt-2 text-3xl font-bold text-foreground">What moved in the market today</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {marketSnapshot.map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="mt-3 text-lg font-bold text-foreground">{item.value}</p>
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
          <h2 className="mt-2 text-3xl font-bold text-foreground">From signal to scale</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-7">
          {timeline.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="flex flex-col items-center gap-3">
                <div className="flex w-full items-center gap-3">
                  <div className="flex h-16 flex-1 flex-col items-center justify-center rounded-xl border border-border bg-card px-3 text-center">
                    <Icon className="mb-2 h-5 w-5 text-cyan-300" />
                    <p className="text-xs font-bold text-foreground">{step.title}</p>
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

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
              Business Proof
            </p>
            <h2 className="mt-2 text-3xl font-bold text-foreground">Built for measurable product decisions</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Product operators use Profit Pilot AI to compare demand, avoid saturated categories, and validate supplier economics before ad spend.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {proofStats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
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
            <h2 className="mt-2 text-3xl font-bold text-foreground">Compare intelligence coverage</h2>
          </div>
          <button
            onClick={scrollToWaitlist}
            className="inline-flex items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-bold text-cyan-200 transition hover:bg-cyan-400/20"
          >
            Join waitlist
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid grid-cols-[1.2fr_repeat(3,0.8fr)] border-b border-border bg-muted/50">
            {["Feature", "Guest", "Registered", "Pro"].map((heading) => (
              <div key={heading} className="p-4 text-sm font-bold text-foreground">
                {heading}
              </div>
            ))}
          </div>
          {pricingRows.map((row) => (
            <div key={row.feature} className="grid grid-cols-[1.2fr_repeat(3,0.8fr)] border-b border-border last:border-b-0">
              <div className="p-4 text-sm text-muted-foreground">{row.feature}</div>
              <PlanCell value={row.guest} />
              <PlanCell value={row.registered} />
              <PlanCell value={row.pro} emphasis />
            </div>
          ))}
        </div>
      </section>

      <section id="waitlist" className="scroll-mt-24 border-t border-border/80 pt-16">
        <WaitlistForm />
      </section>
    </div>
  );
}

function AnimatedDashboardPreview() {
  const bars = [38, 54, 45, 72, 66, 88, 79, 94];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-2xl shadow-black/30">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
            Command Preview
          </p>
          <h3 className="mt-2 text-xl font-bold text-foreground">Market activity engine</h3>
        </div>
        <ShieldCheck className="h-6 w-6 text-cyan-300" />
      </div>

      <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-3">
          {["TikTok velocity", "Supplier risk", "Margin stability", "Launch readiness"].map((label, index) => (
            <div key={label} className="rounded-lg border border-border bg-muted/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-bold text-cyan-300">{82 - index * 7}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-cyan-400 transition-all duration-700"
                  style={{ width: `${82 - index * 7}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-muted/50 p-4">
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
    <div className={`flex items-center gap-2 p-4 text-sm ${emphasis ? "text-cyan-200" : "text-muted-foreground"}`}>
      {included ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-300" />
      ) : (
        <span className="h-4 w-4 shrink-0 text-center text-slate-600">-</span>
      )}
      <span>{value}</span>
    </div>
  );
}
