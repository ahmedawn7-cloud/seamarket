"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Globe2,
  Package,
  PackageSearch,
  Radar,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Truck,
  Users,
  XCircle,
  Zap,
} from "lucide-react";

// ─── Scroll progress hook ──────────────────────────────────────────────────
function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return progress;
}

// ─── InView hook ──────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Reduced motion ────────────────────────────────────────────────────────
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const h = () => setReduced(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return reduced;
}

// ─── FadeUp wrapper ────────────────────────────────────────────────────────
function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView(0.08);
  const reduced = useReducedMotion();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        !reduced && !inView ? "opacity-0 translate-y-10" : "opacity-100 translate-y-0"
      } ${className}`}
      style={{ transitionDelay: reduced ? "0ms" : `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ─── Chapter label ─────────────────────────────────────────────────────────
function Chapter({ n, label }: { n: string; label: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500 text-xs font-black text-background">
        {n}
      </span>
      <span className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-400">{label}</span>
    </div>
  );
}

// ─── Data ──────────────────────────────────────────────────────────────────

const floatingCards = [
  { emoji: "🛍️", label: "Shopee Price", value: "RM 45.90 → RM 39.90", x: "left-[3%] top-[14%]", rotate: "-rotate-3" },
  { emoji: "⭐", label: "Lazada Rating", value: "4.7 · 3.2k reviews", x: "right-[4%] top-[10%]", rotate: "rotate-2" },
  { emoji: "🎵", label: "TikTok Trend", value: "#minicooker 2.8M views", x: "left-[6%] bottom-[22%]", rotate: "rotate-3" },
  { emoji: "📦", label: "Supplier MOQ", value: "Min 50 pcs · RM 18/pc", x: "right-[3%] bottom-[18%]", rotate: "-rotate-2" },
  { emoji: "🚚", label: "Shipping Cost", value: "RM 8–14 / unit", x: "left-[28%] bottom-[8%]", rotate: "-rotate-1" },
  { emoji: "🚩", label: "Risk Flag", value: "CE certification check", x: "right-[26%] top-[6%]", rotate: "rotate-4" },
  { emoji: "📊", label: "Spreadsheet", value: "=SUM(B2:B18) → ???", x: "left-[18%] top-[8%]", rotate: "-rotate-5" },
];

const workflowSteps = [
  { label: "Discover", icon: PackageSearch },
  { label: "Analyze", icon: Radar },
  { label: "Estimate", icon: TrendingUp },
  { label: "Check Risk", icon: ShieldCheck },
  { label: "Source", icon: Truck },
  { label: "Save", icon: Bookmark },
];

const pillars = [
  { label: "Demand Signal", desc: "Is the product showing enough market interest?", score: 84, color: "bg-cyan-400", text: "text-cyan-400", glow: "shadow-cyan-500/20" },
  { label: "Profit Potential", desc: "Does the estimated margin make sense after all costs?", score: 78, color: "bg-emerald-400", text: "text-emerald-400", glow: "shadow-emerald-500/20" },
  { label: "Competition Level", desc: "Is the market still open or already crowded?", score: 65, color: "bg-amber-400", text: "text-amber-400", glow: "shadow-amber-500/20" },
  { label: "Sourcing Readiness", desc: "Can the product realistically be sourced and delivered?", score: 90, color: "bg-indigo-400", text: "text-indigo-400", glow: "shadow-indigo-500/20" },
  { label: "Risk Guidance", desc: "Does the product need extra checks before selling?", score: 88, color: "bg-rose-400", text: "text-rose-400", glow: "shadow-rose-500/20" },
];

const missionSteps = [
  { icon: PackageSearch, label: "Spotted in trending products", detail: "Ranked #7 in Home & Kitchen · Listing growth +23% this month", status: "done" },
  { icon: TrendingUp, label: "Demand appears healthy", detail: "Consistent search volume · 480+ active listings", status: "done" },
  { icon: Radar, label: "Estimated margin is acceptable", detail: "~38% after cost, platform fee & shipping estimate", status: "done" },
  { icon: Users, label: "Competition is medium", detail: "480 similar listings — still an entry opportunity", status: "warn" },
  { icon: ShieldCheck, label: "Risk level is low", detail: "No SIRIM / KKM flag detected on this category", status: "done" },
  { icon: Zap, label: "Suggested action ready", detail: "Research supplier pricing and test small-batch demand.", status: "action" },
];

const decisions = [
  { icon: Bookmark, label: "Save to Shortlist", desc: "Promising signal — track and revisit before committing inventory budget.", color: "cyan" },
  { icon: Radar, label: "Research Further", desc: "More data needed — investigate supplier pricing and competition depth.", color: "indigo" },
  { icon: Truck, label: "Source Supplier", desc: "Strong opportunity — begin sourcing price checks and MOQ negotiation.", color: "emerald" },
  { icon: XCircle, label: "Avoid for Now", desc: "High risk, weak margin, or over-saturated — better options are available.", color: "rose" },
];

const decisionStyles: Record<string, { card: string; icon: string; badge: string }> = {
  cyan:    { card: "border-cyan-400/25 hover:border-cyan-400/50 hover:bg-cyan-400/5",    icon: "bg-cyan-400/10 text-cyan-400",    badge: "bg-cyan-400/10 text-cyan-300" },
  indigo:  { card: "border-indigo-400/25 hover:border-indigo-400/50 hover:bg-indigo-400/5",  icon: "bg-indigo-400/10 text-indigo-400", badge: "bg-indigo-400/10 text-indigo-300" },
  emerald: { card: "border-emerald-400/25 hover:border-emerald-400/50 hover:bg-emerald-400/5", icon: "bg-emerald-400/10 text-emerald-400", badge: "bg-emerald-400/10 text-emerald-300" },
  rose:    { card: "border-rose-400/25 hover:border-rose-400/50 hover:bg-rose-400/5",    icon: "bg-rose-400/10 text-rose-400",    badge: "bg-rose-400/10 text-rose-300" },
};

const calendarEvents = [
  { label: "Ramadan / Raya", period: "Mar – Apr", categories: ["Modest fashion", "Food & Bev", "Home décor"], intensity: 96, color: "bg-emerald-400" },
  { label: "Back to School", period: "Jan & Jul", categories: ["Stationery", "Bags", "Electronics"], intensity: 65, color: "bg-sky-400" },
  { label: "Payday Campaign", period: "Monthly", categories: ["Everyday items", "Beauty", "Snacks"], intensity: 58, color: "bg-slate-400" },
  { label: "9.9 Sale",        period: "September", categories: ["Electronics", "Gadgets", "Beauty"], intensity: 80, color: "bg-orange-400" },
  { label: "10.10 Sale",      period: "October",   categories: ["Fashion", "Accessories", "Lifestyle"], intensity: 84, color: "bg-violet-400" },
  { label: "11.11 Sale",      period: "November",  categories: ["All categories — peak demand season"], intensity: 100, color: "bg-cyan-400" },
  { label: "Monsoon Season",  period: "Nov – Jan", categories: ["Home", "Rain gear", "Indoor hobbies"], intensity: 55, color: "bg-blue-400" },
  { label: "Gift Season",     period: "December",  categories: ["Gifts", "Toys", "Gourmet food"], intensity: 90, color: "bg-rose-400" },
];

const communityStages = [
  { label: "Submitted", icon: PackageSearch, color: "bg-slate-400/10 text-slate-300 border-slate-400/30", count: "12 new", desc: "Sellers submit product ideas and market observations" },
  { label: "Reviewed", icon: Users,          color: "bg-amber-400/10 text-amber-300 border-amber-400/30", count: "8 pending", desc: "Community and moderators assess quality and relevance" },
  { label: "Approved", icon: CheckCircle2,   color: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30", count: "5 today", desc: "Vetted insights enter the shared knowledge base" },
  { label: "Rewarded", icon: Star,           color: "bg-cyan-400/10 text-cyan-300 border-cyan-400/30", count: "+240 pts", desc: "Contributors earn points, rank up, and build reputation" },
];

const trustItems = [
  { label: "AI-assisted insights, not guaranteed profit",         desc: "Every score is model-estimated from available signals. Not a financial guarantee." },
  { label: "Estimated margins, not accounting advice",            desc: "Margin figures are illustrative. Always verify your real cost structure before committing." },
  { label: "Risk guidance, not legal certification",              desc: "Risk flags indicate categories that may need extra checks — not a compliance certificate." },
  { label: "Sample previews, not guaranteed live data",           desc: "Demo content may not reflect current marketplace conditions or product availability." },
  { label: "Sellers should always verify before launch",          desc: "Confirm supplier quality, pricing, regulatory compliance, and stock availability independently." },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface FeaturesPageProps {
  onLogin: () => void;
  onViewDemo: () => void;
}

export default function FeaturesPage({ onLogin, onViewDemo }: FeaturesPageProps) {
  const scrollProgress = useScrollProgress();
  const reduced = useReducedMotion();

  // InView refs for interactive sections
  const sec2 = useInView(0.1);
  const sec3 = useInView(0.1);
  const sec4 = useInView(0.1);
  const sec5 = useInView(0.08);
  const sec6 = useInView(0.1);
  const sec7 = useInView(0.08);
  const sec8 = useInView(0.1);
  const sec9 = useInView(0.1);

  // Mission card step reveal
  const [visibleSteps, setVisibleSteps] = useState(0);
  useEffect(() => {
    if (!sec5.inView) return;
    let n = 0;
    const t = setInterval(() => {
      n++;
      setVisibleSteps(n);
      if (n >= missionSteps.length) clearInterval(t);
    }, reduced ? 0 : 450);
    return () => clearInterval(t);
  }, [sec5.inView, reduced]);

  const scrollToJourney = () => {
    document.getElementById("journey-start")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="dark-theme relative overflow-x-hidden">

      {/* ── Scroll Progress Bar ── */}
      <div
        className="fixed left-0 top-0 z-50 h-[3px] bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-100 hidden sm:block"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Page reading progress"
      />

      {/* ══════════════════════════════════════════════════════════════════
           HERO — The Product Research Mission
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[88vh] overflow-hidden border-b border-border/50 flex flex-col justify-center">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-10%] h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-cyan-500/8 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-indigo-500/6 blur-[80px]" />
        </div>

        {/* Floating chaos cards — hidden on mobile */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          {floatingCards.map((c, i) => (
            <div
              key={c.label}
              className={`absolute rounded-xl border border-border/80 bg-card/90 px-3 py-2.5 shadow-lg backdrop-blur-sm ${c.x} ${c.rotate}`}
              style={{
                opacity: reduced ? 0.7 : 0.85,
                animation: reduced ? "none" : `float ${3 + i * 0.4}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.3}s`,
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{c.emoji} {c.label}</p>
              <p className="mt-0.5 text-xs font-bold text-foreground">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-28 text-center sm:px-6">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">The Product Research Mission</span>
          </div>

          <h1 className="text-5xl font-black leading-[1.1] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Product research<br />
            <span className="relative inline-block">
              should not be chaos
              <span className="absolute -bottom-2 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-rose-500/60 to-rose-400/30" />
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed text-muted-foreground sm:text-2xl">
            Profit Pilot AI turns scattered marketplace signals into a guided product decision system for Southeast Asia sellers.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={onLogin}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-8 py-4 text-base font-black text-background transition hover:bg-cyan-400 hover:scale-105"
            >
              Start Free <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={scrollToJourney}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-8 py-4 text-base font-bold text-foreground backdrop-blur transition hover:border-cyan-400/40 hover:bg-card"
            >
              Start the journey <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Floating animation keyframes */}
      <style>{`
        @keyframes float {
          from { transform: translateY(0px) rotate(var(--tw-rotate, 0deg)); }
          to { transform: translateY(-10px) rotate(var(--tw-rotate, 0deg)); }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════
           CHAPTER 1 — Scattered Signals
      ══════════════════════════════════════════════════════════════════ */}
      <section id="journey-start" className="border-b border-border/50 bg-muted/15">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Copy */}
            <FadeUp>
              <Chapter n="1" label="The Problem" />
              <h2 className="text-4xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
                Scattered signals.<br />No clear picture.
              </h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Most sellers jump between marketplace tabs, supplier pages, social trends, screenshots, and spreadsheets. The problem is not lack of product ideas — it is lack of structure.
              </p>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                By the time research is done, the trend may already be crowded, the margin calculated wrong, or the risk category missed entirely.
              </p>
            </FadeUp>

            {/* Signal chaos visual */}
            <div ref={sec2.ref}>
              <div className="relative h-80 overflow-hidden rounded-2xl border border-border bg-card/60 sm:h-96">
                {/* Grid bg */}
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: "radial-gradient(circle,#1e3548 1px,transparent 1px)", backgroundSize: "26px 26px" }}
                />
                {[
                  { label: "Price changed", emoji: "📉", val: "RM 45 → RM 38", pos: "top-[10%] left-[6%]", rot: "-rotate-3" },
                  { label: "Trend rising", emoji: "📈", val: "#trending 1.4M views", pos: "top-[8%] right-[8%]", rot: "rotate-2" },
                  { label: "High competition", emoji: "⚠️", val: "480 similar listings", pos: "top-[38%] left-[3%]", rot: "rotate-4" },
                  { label: "Supplier MOQ", emoji: "📦", val: "Min 100 units · RM 16/pc", pos: "top-[42%] right-[4%]", rot: "-rotate-2" },
                  { label: "Shipping unknown", emoji: "🚚", val: "Cost not confirmed", pos: "bottom-[18%] left-[20%]", rot: "-rotate-1" },
                  { label: "Risk check needed", emoji: "🚩", val: "CE cert required?", pos: "bottom-[16%] right-[14%]", rot: "rotate-3" },
                ].map((card, i) => (
                  <div
                    key={card.label}
                    className={`absolute rounded-xl border border-border bg-card px-3 py-2 shadow-md ${card.pos} ${card.rot}`}
                    style={{
                      opacity: sec2.inView && !reduced ? 1 : 0,
                      transform: sec2.inView && !reduced ? "scale(1) translateY(0)" : "scale(0.85) translateY(12px)",
                      transition: `opacity 0.45s ease ${i * 90}ms, transform 0.45s ease ${i * 90}ms`,
                    }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{card.emoji} {card.label}</p>
                    <p className="mt-0.5 text-xs font-bold text-foreground">{card.val}</p>
                  </div>
                ))}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="rounded-full border border-rose-400/40 bg-rose-400/10 px-5 py-2 backdrop-blur"
                    style={{ opacity: sec2.inView ? 1 : 0, transition: "opacity 0.6s ease 0.7s" }}
                  >
                    <p className="text-sm font-bold text-rose-300">scattered · slow · risky</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
           CHAPTER 2 — One Intelligence System
      ══════════════════════════════════════════════════════════════════ */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Workflow visual */}
            <div ref={sec3.ref} className="order-2 lg:order-1">
              <div className="relative rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/20">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">One guided workflow</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {workflowSteps.map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <div
                        key={step.label}
                        className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/30 p-4 text-center"
                        style={{
                          opacity: sec3.inView && !reduced ? 1 : 0,
                          transform: sec3.inView && !reduced ? "translateY(0) scale(1)" : "translateY(16px) scale(0.9)",
                          transition: `opacity 0.4s ease ${i * 80}ms, transform 0.4s ease ${i * 80}ms`,
                        }}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10">
                          <Icon className="h-5 w-5 text-cyan-400" />
                        </div>
                        <p className="text-xs font-bold text-foreground">{step.label}</p>
                      </div>
                    );
                  })}
                </div>
                {/* Arrow row */}
                <div className="mt-4 flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
                  {workflowSteps.map((step, i) => (
                    <span key={step.label} className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-muted-foreground">{step.label}</span>
                      {i < workflowSteps.length - 1 && <span className="text-muted-foreground/40">›</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Copy */}
            <FadeUp className="order-1 lg:order-2">
              <Chapter n="2" label="The Transformation" />
              <h2 className="text-4xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
                One intelligence system
              </h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Profit Pilot AI organises product research into one repeatable workflow, so sellers can compare opportunities instead of guessing from scattered data.
              </p>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                Instead of jumping between tabs, each step in the process builds on the last — from discovery to a clear suggested action.
              </p>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
           CHAPTER 3 — Product Evaluation Engine
      ══════════════════════════════════════════════════════════════════ */}
      <section className="border-b border-border/50 bg-muted/15">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <FadeUp>
              <Chapter n="3" label="The Engine" />
              <h2 className="text-4xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
                How Profit Pilot AI evaluates a product
              </h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Every product idea is reviewed through the signals that matter most: demand, margin potential, competition, sourcing readiness, and risk guidance.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Scores are AI-assisted estimates from available market signals. Not a guarantee of actual profit or market performance.
              </p>
            </FadeUp>

            <div ref={sec4.ref} className="space-y-4">
              {pillars.map((p, i) => (
                <div
                  key={p.label}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm"
                  style={{
                    opacity: sec4.inView && !reduced ? 1 : 0,
                    transform: sec4.inView && !reduced ? "translateX(0)" : "translateX(30px)",
                    transition: `opacity 0.5s ease ${i * 110}ms, transform 0.5s ease ${i * 110}ms`,
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">{p.label}</p>
                    <span className={`text-lg font-black ${p.text}`}>{p.score}</span>
                  </div>
                  <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-muted/50">
                    <div
                      className={`h-full rounded-full ${p.color} transition-all duration-1000 shadow-sm ${p.glow}`}
                      style={{ width: sec4.inView && !reduced ? `${p.score}%` : "0%", transitionDelay: `${i * 110 + 300}ms` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </div>
              ))}
              {/* Composite Score */}
              <div
                className="flex items-center justify-between rounded-xl border-2 border-cyan-400/40 bg-gradient-to-r from-cyan-400/10 to-cyan-400/5 px-5 py-4"
                style={{
                  opacity: sec4.inView && !reduced ? 1 : 0,
                  transition: `opacity 0.6s ease ${pillars.length * 110 + 400}ms`,
                }}
              >
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-300">AI-Assisted Opportunity Score</p>
                  <p className="text-xs text-muted-foreground">Estimated · Sample only · Not guaranteed</p>
                </div>
                <p className="text-5xl font-black text-cyan-400">82</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
           CHAPTER 4 — Sample Product Mission
      ══════════════════════════════════════════════════════════════════ */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            {/* Product card */}
            <div ref={sec5.ref}>
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/25">
                <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                      <Package className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Mini Rice Cooker</p>
                      <p className="text-xs text-muted-foreground">AI Product Analysis — Live walkthrough</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold text-amber-300">
                    Sample Only
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-px bg-border">
                  {[
                    { l: "Opportunity", v: "82/100", c: "text-cyan-400" },
                    { l: "Est. Margin", v: "38%", c: "text-emerald-400" },
                    { l: "Risk Level", v: "Low", c: "text-green-400" },
                  ].map(m => (
                    <div key={m.l} className="flex flex-col items-center bg-card p-4 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{m.l}</p>
                      <p className={`mt-1 text-2xl font-black ${m.c}`}>{m.v}</p>
                    </div>
                  ))}
                </div>

                {/* Steps reveal */}
                <div className="space-y-2 p-4">
                  {missionSteps.map((step, i) => {
                    const Icon = step.icon;
                    const visible = i < visibleSteps;
                    return (
                      <div
                        key={i}
                        className={`flex items-start gap-3 rounded-lg p-3 transition-all duration-400 ${
                          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                        } ${step.status === "action" ? "border border-cyan-400/20 bg-cyan-400/5" : "bg-muted/20"}`}
                      >
                        <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          step.status === "done" ? "bg-emerald-400/10" :
                          step.status === "warn" ? "bg-amber-400/10" : "bg-cyan-400/10"
                        }`}>
                          {step.status === "done"   && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                          {step.status === "warn"   && <AlertTriangle className="h-4 w-4 text-amber-400" />}
                          {step.status === "action" && <Zap className="h-4 w-4 text-cyan-400" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground">{step.label}</p>
                          <p className="text-xs leading-5 text-muted-foreground">{step.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-border/50 px-5 py-3 text-center">
                  <p className="text-[10px] text-slate-500">Sample preview only. Not guaranteed live marketplace data.</p>
                </div>
              </div>
            </div>

            {/* Copy */}
            <FadeUp>
              <Chapter n="4" label="Sample Product Mission" />
              <h2 className="text-4xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
                One product idea becomes a full decision
              </h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Watch how Profit Pilot AI walks through a sample product — from spotting a trending item to arriving at a clear suggested action.
              </p>
              <div className="mt-6 space-y-4">
                {[
                  { label: "Opportunity Score", value: "82 / 100", color: "text-cyan-400" },
                  { label: "Estimated Margin", value: "38%", color: "text-emerald-400" },
                  { label: "Competition Level", value: "Medium", color: "text-amber-400" },
                  { label: "Risk Level", value: "Low", color: "text-green-400" },
                  { label: "Supplier Readiness", value: "High", color: "text-indigo-400" },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3">
                    <span className="text-sm font-bold text-muted-foreground">{m.label}</span>
                    <span className={`text-base font-black ${m.color}`}>{m.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3">
                <p className="text-xs font-bold text-amber-300">Illustrative sample data</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Results depend on available market signals and user research inputs.</p>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
           CHAPTER 5 — From Idea to Action
      ══════════════════════════════════════════════════════════════════ */}
      <section className="border-b border-border/50 bg-muted/15">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <FadeUp className="mb-12">
            <Chapter n="5" label="Decision Outputs" />
            <div className="max-w-2xl">
              <h2 className="text-4xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
                From idea to action
              </h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Profit Pilot AI is not just a product list. Every product idea should lead to a clear next action — not another confusing spreadsheet.
              </p>
            </div>
          </FadeUp>

          <div ref={sec6.ref} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {decisions.map((d, i) => {
              const Icon = d.icon;
              const style = decisionStyles[d.color];
              return (
                <div
                  key={d.label}
                  className={`group rounded-2xl border bg-card p-6 shadow-md transition-all duration-300 cursor-default ${style.card}`}
                  style={{
                    opacity: sec6.inView && !reduced ? 1 : 0,
                    transform: sec6.inView && !reduced ? "translateY(0) scale(1)" : "translateY(24px) scale(0.95)",
                    transition: `opacity 0.45s ease ${i * 100}ms, transform 0.45s ease ${i * 100}ms`,
                  }}
                >
                  <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${style.icon}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-base font-black text-foreground">{d.label}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{d.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
           CHAPTER 6 — Community Intelligence
      ══════════════════════════════════════════════════════════════════ */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <FadeUp>
              <Chapter n="6" label="Community Intelligence" />
              <h2 className="text-4xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
                Better discovery through shared insight
              </h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Sellers and researchers contribute product discoveries, share market observations, and help build a shared knowledge base. Quality is maintained through approval workflows, contribution tracking, and reward points.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {[
                  { label: "Ideas submitted", value: "1,240+", icon: PackageSearch },
                  { label: "Insights approved", value: "890+", icon: CheckCircle2 },
                  { label: "Active contributors", value: "340+", icon: Users },
                  { label: "Reward points issued", value: "48k+", icon: Star },
                ].map(stat => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
                      <Icon className="mb-2 h-5 w-5 text-cyan-400" />
                      <p className="text-2xl font-black text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </FadeUp>

            {/* Pipeline visual */}
            <div ref={sec7.ref}>
              <div className="space-y-3">
                {communityStages.map((stage, i) => {
                  const Icon = stage.icon;
                  return (
                    <div
                      key={stage.label}
                      className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-sm"
                      style={{
                        opacity: sec7.inView && !reduced ? 1 : 0,
                        transform: sec7.inView && !reduced ? "translateX(0)" : "translateX(30px)",
                        transition: `opacity 0.4s ease ${i * 120}ms, transform 0.4s ease ${i * 120}ms`,
                      }}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${stage.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-foreground">{stage.label}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${stage.color}`}>{stage.count}</span>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">{stage.desc}</p>
                      </div>
                    </div>
                  );
                })}
                {/* Flow arrow */}
                <div className="flex items-center justify-center gap-2 py-2">
                  {communityStages.map((s, i) => (
                    <span key={s.label} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">{s.label}</span>
                      {i < communityStages.length - 1 && <span className="text-cyan-400">→</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
           CHAPTER 7 — Weekly Opportunity Calendar
      ══════════════════════════════════════════════════════════════════ */}
      <section className="border-b border-border/50 bg-muted/15">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <FadeUp className="mb-12">
            <Chapter n="7" label="Timing Matters" />
            <div className="grid items-end gap-6 lg:grid-cols-2">
              <div>
                <h2 className="text-4xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
                  Weekly opportunity calendar
                </h2>
                <p className="mt-6 text-lg leading-8 text-muted-foreground">
                  Some products perform better because of timing — payday campaigns, festive seasons, school periods, weather shifts, and major marketplace promotions.
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Seasonal opportunity signals · AI-assisted planning notes · Category watchlist — Not guaranteed demand data
                </p>
              </div>
              <div className="flex items-end justify-start gap-3 pb-1 lg:justify-end">
                {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => {
                  const height = [55,45,96,92,48,42,60,52,80,84,100,90][i];
                  return (
                    <div key={m} className="flex flex-col items-center gap-1">
                      <div
                        className="w-5 rounded-t-sm bg-cyan-400/70 transition-all duration-700"
                        style={{ height: `${(height / 100) * 60}px`, opacity: 0.4 + height / 200 }}
                      />
                      <span className="text-[9px] text-muted-foreground">{m}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </FadeUp>

          <div ref={sec8.ref} className="space-y-3">
            {calendarEvents.map((ev, i) => (
              <div
                key={ev.label}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-cyan-400/30"
                style={{
                  opacity: sec8.inView && !reduced ? 1 : 0,
                  transform: sec8.inView && !reduced ? "translateX(0)" : "translateX(-20px)",
                  transition: `opacity 0.4s ease ${i * 75}ms, transform 0.4s ease ${i * 75}ms`,
                }}
              >
                <div className="flex w-36 shrink-0 flex-col">
                  <p className="text-sm font-black text-foreground">{ev.label}</p>
                  <p className="text-xs text-muted-foreground">{ev.period}</p>
                </div>
                <div className="flex-1">
                  <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-muted/50">
                    <div
                      className={`h-full rounded-full ${ev.color} transition-all duration-1000`}
                      style={{ width: sec8.inView && !reduced ? `${ev.intensity}%` : "0%", transitionDelay: `${i * 75 + 350}ms` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ev.categories.map(cat => (
                      <span key={cat} className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[10px] text-muted-foreground">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="shrink-0 text-base font-black text-muted-foreground">{ev.intensity}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
           CHAPTER 8 — Trust Section
      ══════════════════════════════════════════════════════════════════ */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <FadeUp className="mb-12 text-center">
            <Chapter n="8" label="Trust & Transparency" />
            <h2 className="text-4xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
              Built for decisions, not hype
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
              Profit Pilot AI is designed to reduce guesswork, not promise guaranteed winners.
            </p>
          </FadeUp>

          <div ref={sec9.ref} className="mx-auto max-w-4xl">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/15">
              {trustItems.map((item, i) => (
                <div
                  key={item.label}
                  className={`flex items-start gap-4 px-6 py-5 ${i < trustItems.length - 1 ? "border-b border-border/60" : ""}`}
                  style={{
                    opacity: sec9.inView && !reduced ? 1 : 0,
                    transform: sec9.inView && !reduced ? "translateX(0)" : "translateX(-16px)",
                    transition: `opacity 0.4s ease ${i * 100}ms, transform 0.4s ease ${i * 100}ms`,
                  }}
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-400/10">
                    <ShieldCheck className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{item.label}</p>
                    <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
           FINAL CTA — Command Center
      ══════════════════════════════════════════════════════════════════ */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="relative overflow-hidden rounded-3xl border-2 border-cyan-400/20 bg-card shadow-2xl shadow-black/30">
              {/* Grid pattern */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.035]"
                style={{
                  backgroundImage: "linear-gradient(#00c8f0 1px,transparent 1px),linear-gradient(90deg,#00c8f0 1px,transparent 1px)",
                  backgroundSize: "44px 44px",
                }}
              />
              <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[700px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[100px]" />

              <div className="relative px-8 py-16 sm:px-16 lg:py-20">
                <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto]">
                  <div>
                    {/* Status chip */}
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">System Ready</span>
                    </div>

                    <h2 className="text-4xl font-black leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                      Turn product research<br />into a repeatable system
                    </h2>
                    <p className="mt-6 max-w-lg text-xl text-muted-foreground">
                      Discover, analyse, compare, source, and save product opportunities with a workflow built for Southeast Asia sellers.
                    </p>

                    {/* Workflow chips */}
                    <div className="mt-8 flex flex-wrap gap-2">
                      {["Discover", "Analyze", "Compare", "Source", "Save"].map((chip, i) => (
                        <span
                          key={chip}
                          className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm font-bold text-foreground"
                        >
                          {chip}
                          {i < 4 && <span className="text-cyan-400/60">→</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 lg:min-w-[220px]">
                    <button
                      onClick={onLogin}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-8 py-5 text-lg font-black text-background transition hover:bg-cyan-400 hover:scale-105"
                    >
                      Start Free <ArrowRight className="h-5 w-5" />
                    </button>
                    <button
                      onClick={onViewDemo}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-transparent px-8 py-4 text-base font-bold text-foreground transition hover:border-cyan-400/50 hover:bg-muted/40"
                    >
                      View Demo
                    </button>
                    <p className="text-center text-xs text-muted-foreground">
                      Free to start · No credit card required
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

    </div>
  );
}
