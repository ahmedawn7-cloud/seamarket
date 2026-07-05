"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getBrowserSupabaseClient } from "@/lib/supabase/browserClient";
import { sendPasarAIMessage } from "@/lib/chat/chatClient";
import {
  Activity,
  Bookmark,
  ChevronDown,
  DollarSign,
  ExternalLink,
  ImageOff,
  Package,
  Scale,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import type { ChatMessage } from "@/types/chat";

const supabase = getBrowserSupabaseClient();

export default function ProductDrawer({
  product,
  session,
  onClose,
  onResearch,
}: {
  product: any;
  session?: Session | null;
  onClose: () => void;
  onResearch?: (product: any) => void;
}) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showSourcing, setShowSourcing] = useState(false);
  const [aiActionLoading, setAiActionLoading] = useState<string | null>(null);
  const [aiResultTitle, setAiResultTitle] = useState("");
  const [aiResult, setAiResult] = useState("");
  const details = useMemo(() => normalizeProduct(product), [product]);
  const estimatedTrend = useMemo(() => buildEstimatedTrend(details), [details]);

  useEffect(() => {
    let isMounted = true;

    async function checkCloudSave() {
      setSaveStatus("idle");
      if (!supabase || !session?.user || !product) return;

      const { data } = await supabase
        .from("user_watchlist")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("product_id", details.id)
        .maybeSingle();

      if (isMounted && data) setSaveStatus("saved");
    }

    checkCloudSave();

    return () => {
      isMounted = false;
    };
  }, [product, session, details.id]);

  if (!product) return null;

  async function saveToWatchlist() {
    setSaveStatus("saving");
    setMessage("");

    if (!supabase) {
      setSaveStatus("error");
      setMessage("Supabase is not configured. Product was not saved.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaveStatus("error");
      setMessage("Sign in to save products to your Supabase watchlist.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    const { error } = await supabase.from("user_watchlist").upsert({
      user_id: user.id,
      product_id: details.id,
      snapshot: product,
    });

    if (error) {
      setSaveStatus("error");
      console.warn("Watchlist save unavailable:", error.message);
      setMessage("Saved products sync is not ready yet. Please try again after watchlist storage is enabled.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setSaveStatus("saved");
    setMessage("Product saved to Research Hub.");
    setTimeout(() => setMessage(""), 3000);
  }

  async function runAiAction(action: "analyze" | "scores" | "marketing" | "listing" | "compare") {
    if (action === "compare") {
      setAiResultTitle("Compare Products");
      setAiResult("Select at least 2 products to compare.");
      return;
    }

    const prompts: Record<string, string> = {
      analyze: `Analyze this product opportunity for Malaysia. Explain demand, competition, risk, and whether you recommend testing it now.\nProduct: ${details.name}\nCategory: ${details.category}\nPrice: ${details.price}\nSales: ${details.sales}\nTrend rank: ${details.trendRank}`,
      scores: `Explain the available product scores for this product. If score tables are missing, say scores are not available yet and suggest running the Scoring Bot.\nProduct: ${details.name}\nCategory: ${details.category}\nPrice: ${details.price}\nSales: ${details.sales}`,
      marketing: `Generate TikTok hooks, Shopee keywords, and ad angles for this product.\nProduct: ${details.name}\nCategory: ${details.category}\nPrice: ${details.price}`,
      listing: `Generate a Shopee title, Lazada title, TikTok title, short description, and bullet points for this product.\nProduct: ${details.name}\nCategory: ${details.category}\nPrice: ${details.price}`,
      compare: "",
    };

    const labels: Record<string, string> = {
      analyze: "Analyze Product",
      scores: "Explain Scores",
      marketing: "Marketing Ideas",
      listing: "Generate Listing",
      compare: "Compare Products",
    };

    setAiActionLoading(action);
    setAiResultTitle(labels[action]);
    setAiResult("");

    try {
      const history: ChatMessage[] = [
        {
          id: `drawer-${action}-${details.id}`,
          role: "user",
          content: prompts[action],
          createdAt: Date.now(),
        },
      ];

      const response = await sendPasarAIMessage(history, "research", {
        userId: session?.user?.id,
        explicitProductIds: [details.id],
        selectedProduct: product,
      });

      setAiResult(response.content);
    } catch (error) {
      setAiResult(error instanceof Error ? error.message : "Pasar AI is not connected. Check AI_PROVIDER and model configuration.");
    } finally {
      setAiActionLoading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      {message && (
        <div className="absolute left-1/2 top-4 z-[110] -translate-x-1/2 rounded-full border border-cyan-400/30 bg-background/90 px-6 py-3 text-sm font-bold text-cyan-300 shadow-xl shadow-cyan-900/20 backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-4">
          {message}
        </div>
      )}

      <aside className="relative flex h-full w-full max-w-4xl flex-col overflow-y-auto border-l border-cyan-400/20 bg-card shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-background/92 p-6 backdrop-blur-md">
          <div>
            <h2 className="text-2xl font-bold leading-tight text-foreground">{details.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{details.platform} / {details.category}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveToWatchlist}
              disabled={saveStatus === "saving" || saveStatus === "saved"}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition ${
                saveStatus === "saved"
                  ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400"
                  : "border-border bg-muted text-muted-foreground hover:border-cyan-400 hover:text-foreground"
              }`}
            >
              <Bookmark className={`h-4 w-4 ${saveStatus === "saved" ? "fill-emerald-400" : ""}`} />
              {saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving..." : "Save Product"}
            </button>
            <button onClick={onClose} className="rounded-lg bg-muted p-2 text-muted-foreground transition hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex w-full flex-col gap-3 lg:w-1/3">
              <div className="h-64 overflow-hidden rounded-xl border border-border bg-card">
                {details.imageUrl ? (
                  <img src={details.imageUrl} alt={details.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-slate-500">
                    <ImageOff className="mb-3 h-10 w-10" />
                    No image available
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 w-1/4 rounded-lg border border-border bg-card"></div>
                ))}
              </div>
            </div>

            <div className="flex w-full flex-col lg:w-2/3">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Kpi label="Rank" value={`#${details.rank}`} color="text-emerald-300" />
                <Kpi label="Sales (Est.)" value={details.sales} color="text-cyan-300" />
                <Kpi label="Price" value={details.price} color="text-indigo-300" />
                <Kpi label="Reviews" value={details.reviews} color="text-amber-300" />
                <Kpi label="Revenue (Est.)" value={details.revenue} color={details.revenue === "Data pending" ? "text-slate-500" : "text-emerald-400"} />
                <Kpi label="Margin" value={details.margin} color={details.margin === "Data pending" ? "text-slate-500" : "text-cyan-400"} />
                <Kpi label="Trend Rank" value={details.trendRank} color="text-emerald-300" />
                <Kpi label="Stock Level" value={details.stock} color="text-amber-300" />
              </div>

              <div className="mt-6 border-b border-border">
                <div className="flex gap-6 overflow-x-auto pb-4">
                  {["Overview", "Market", "Analytics", "Sourcing", "AI Insights", "History"].map((tab, idx) => (
                    <button
                      key={tab}
                      className={`shrink-0 text-sm font-medium transition ${
                        idx === 0
                          ? "border-b-2 border-cyan-400 pb-4 -mb-[17px] text-cyan-400"
                          : "text-muted-foreground hover:text-slate-200"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground">Market Snapshot</h3>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <InfoRow label="Category" value={details.category} />
                    <InfoRow label="Shipping Location" value={details.shipping} />
                    <InfoRow label="Variants" value={details.variants} />
                    <InfoRow label="Weight (kg)" value={details.weight} />
                  </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground">Sales Trend (30 Days)</h3>
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[10px] font-bold text-cyan-300">Estimated</span>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <TrendChart points={estimatedTrend.sales} stroke="#22d3ee" />
                      <div className="mt-3 grid grid-cols-4 gap-2 text-[11px] text-muted-foreground">
                        <TrendLegend label="Sales" color="bg-cyan-400" value={estimatedTrend.summary.sales} />
                        <TrendLegend label="Price" color="bg-indigo-400" value={estimatedTrend.summary.price} />
                        <TrendLegend label="Reviews" color="bg-amber-400" value={estimatedTrend.summary.reviews} />
                        <TrendLegend label="Demand" color="bg-emerald-400" value={estimatedTrend.summary.demand} />
                      </div>
                      <p className="mt-3 text-xs leading-5 text-muted-foreground">
                        Estimated trial trend based on current rank, sales, price, and category. Real history will appear after weekly tracking runs.
                      </p>
                    </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => onResearch?.(product)}
              className="flex items-center justify-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400/20"
            >
              <Scale className="h-4 w-4" />
              Research Deeper
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowSourcing(!showSourcing)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-bold text-foreground transition hover:border-cyan-400"
              >
                <Package className="h-4 w-4" />
                Source Product
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
              
              {showSourcing && (
                <div className="absolute left-0 top-full mt-2 w-full rounded-xl border border-border bg-card p-2 shadow-xl shadow-black/50 z-20">
                  {["1688", "Alibaba", "CJ Dropshipping", "Taobao"].map((src) => (
                    <button
                      key={src}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                      onClick={() => setShowSourcing(false)}
                    >
                      Search on {src}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {details.productUrl ? (
              <a
                href={details.productUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-bold text-foreground transition hover:border-cyan-400"
              >
                <ExternalLink className="h-4 w-4" />
                Open Marketplace
              </a>
            ) : (
              <button className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-bold text-slate-500 cursor-not-allowed">
                Open Marketplace
              </button>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex gap-4 border-b border-border pb-4 mb-4 text-sm text-muted-foreground">
              <span className="text-cyan-400 border-b border-cyan-400 -mb-[17px] pb-4 font-medium">Pasar AI Actions</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["analyze", "Analyze Product"],
                ["scores", "Explain Scores"],
                ["marketing", "Marketing Ideas"],
                ["listing", "Generate Listing"],
                ["compare", "Compare Products"],
              ].map(([action, label]) => (
                <button
                  key={action}
                  onClick={() => runAiAction(action as "analyze" | "scores" | "marketing" | "listing" | "compare")}
                  disabled={Boolean(aiActionLoading)}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 p-4 text-xs font-bold text-foreground transition hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {aiActionLoading === action ? "Thinking..." : label}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-foreground">{aiResultTitle || "AI Result"}</p>
                {aiActionLoading && <span className="text-xs font-bold text-cyan-300">Loading...</span>}
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {aiResult || "Run an AI action to get a product-specific analysis, score explanation, or listing draft."}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function normalizeProduct(product: any) {
  const cleanName = product?.clean_name_ai || product?.Clean_Name_AI;
  const productName = product?.product_name || product?.Product_Name;
  const name =
    cleanName && cleanName !== "The language entered is not supported at this time."
      ? cleanName
      : productName || "Unknown product";

  return {
    id: String(product?.id || product?.Product_URL || product?.Product_Name || name),
    name,
    imageUrl: product?.image_url || product?.Image_URL,
    productUrl: product?.product_url || product?.Product_URL,
    platform: product?.platform || product?.Platform || "Marketplace",
    category: product?.category || product?.Category || "Uncategorized",
    rank: product?.rank ?? product?.Rank ?? product?.Internal_Rank ?? "N/A",
    trendRank: String(product?.trend_rank ?? product?.Trend_Rank ?? product?.Internal_Rank ?? "N/A"),
    price: formatCurrency(product?.price ?? product?.Price_RM ?? product?.Price),
    sales: formatNumber(product?.sales ?? product?.Sales),
    revenue: formatCurrencyOrPending(product?.revenue_calc ?? product?.Revenue_Calc ?? product?.revenue ?? product?.Revenue),
    margin: formatPercent(product?.net_margin_calc ?? product?.Net_Margin_Calc ?? product?.margin ?? product?.Margin),
    reviews: formatNumber(product?.review_count ?? product?.Review_Count),
    stock: String(product?.stock_level ?? product?.Stock_Level ?? "Unknown"),
    shipping: String(product?.shipping_location ?? product?.Shipping_Location ?? "Unknown"),
    variants: String(product?.variant_count ?? product?.Variant_Count ?? "N/A"),
    weight: String(product?.weight_kg ?? product?.Weight_kg ?? "Data pending"),
  };
}

function formatCurrency(value: any) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "N/A";
  return `RM ${number.toFixed(2)}`;
}

function formatCurrencyOrPending(value: any) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "Data pending";
  return `RM ${number.toFixed(2)}`;
}

function formatNumber(value: any) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "N/A";
  return Intl.NumberFormat("en-MY").format(number);
}

function formatPercent(value: any) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "Data pending";
  return `${number.toFixed(1)}%`;
}

function Kpi({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-bold text-foreground">{value}</span>
    </div>
  );
}

function buildEstimatedTrend(details: ReturnType<typeof normalizeProduct>) {
  const seed = createSeed(details);
  const sales = createDeterministicSeries(seed + 17, 30, valueFromString(details.sales, 120), 0.16, 1);
  const price = createDeterministicSeries(seed + 31, 30, valueFromCurrency(details.price, 24), 0.035, 2);
  const reviews = createDeterministicSeries(seed + 43, 30, valueFromString(details.reviews, 45), 0.11, 1);
  const demand = createDeterministicSeries(seed + 59, 30, deriveDemandBase(details), 0.09, 2);

  return {
    sales,
    price,
    reviews,
    demand,
    summary: {
      sales: summarizeSeries(sales, ""),
      price: summarizeSeries(price, "RM "),
      reviews: summarizeSeries(reviews, ""),
      demand: summarizeSeries(demand, ""),
    },
  };
}

function createSeed(details: ReturnType<typeof normalizeProduct>) {
  const source = `${details.id}|${details.category}|${details.rank}|${details.trendRank}|${details.price}|${details.sales}|${details.reviews}`;
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }

  return hash || 97;
}

function createDeterministicSeries(seed: number, length: number, baseline: number, volatility: number, decimals: number) {
  let value = Math.max(baseline, 1);
  const points: number[] = [];

  for (let index = 0; index < length; index += 1) {
    const drift = Math.sin((seed + index) * 0.37) * volatility;
    const seasonal = Math.cos((seed + index * 3) * 0.18) * (volatility / 2);
    value = Math.max(value * (1 + drift + seasonal), baseline * 0.45, 1);
    points.push(Number(value.toFixed(decimals)));
  }

  return points;
}

function summarizeSeries(points: number[], prefix: string) {
  const start = points[0] ?? 0;
  const end = points[points.length - 1] ?? start;
  const delta = start === 0 ? 0 : ((end - start) / start) * 100;
  const direction = delta >= 0 ? "+" : "";
  return `${prefix}${Number(end.toFixed(1))} (${direction}${delta.toFixed(1)}%)`;
}

function valueFromCurrency(value: string, fallback: number) {
  const number = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : fallback;
}

function valueFromString(value: string, fallback: number) {
  const number = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : fallback;
}

function deriveDemandBase(details: ReturnType<typeof normalizeProduct>) {
  const rank = valueFromString(String(details.rank), 160);
  const sales = valueFromString(details.sales, 120);
  const reviews = valueFromString(details.reviews, 40);
  const trendRank = valueFromString(details.trendRank, rank);
  const demandScore = Math.max(20, Math.min(95, 90 - rank * 0.04 + sales * 0.003 + reviews * 0.02 - trendRank * 0.02));
  return Number(demandScore.toFixed(1));
}

function TrendChart({ points, stroke }: { points: number[]; stroke: string }) {
  const width = 320;
  const height = 160;
  const padding = 12;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const path = points
    .map((point, index) => {
      const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((point - min) / range) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full">
      <defs>
        <linearGradient id="drawer-trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((line) => {
        const y = padding + (line / 3) * (height - padding * 2);
        return <line key={line} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(148, 163, 184, 0.14)" strokeWidth="1" />;
      })}
      <path d={`${path} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`} fill="url(#drawer-trend-fill)" />
      <path d={path} fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendLegend({ label, color, value }: { label: string; color: string; value: string }) {
  return (
    <div className="space-y-1 rounded-lg border border-border bg-card px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span>{label}</span>
      </div>
      <p className="text-[10px] font-bold text-foreground">{value}</p>
    </div>
  );
}
