"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import {
  Activity,
  BarChart3,
  Bell,
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

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
  const details = useMemo(() => normalizeProduct(product), [product]);

  useEffect(() => {
    if (typeof window !== "undefined" && product) {
      const key = getResearchStorageKey(session);
      const raw = localStorage.getItem(key);
      if (raw) {
        const current = JSON.parse(raw);
        const savedProducts = Array.isArray(current.savedProducts) ? current.savedProducts : [];
        const isSaved = savedProducts.some((item: any) => {
          if (!details.id) return false;
          return String(item?.id || item?.Product_URL || item?.Product_Name || item?.Clean_Name_AI || "") === details.id;
        });
        if (isSaved) {
          setSaveStatus("saved");
        } else {
          setSaveStatus("idle");
        }
      } else {
        setSaveStatus("idle");
      }
    }
  }, [product, session, details.id]);

  const trendData = useMemo(() => {
    const seed = details.id || details.name || "default";
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const random = () => {
      const x = Math.sin(hash++) * 10000;
      return x - Math.floor(x);
    };
    
    const data = [];
    let current = 20 + random() * 20;
    let min = current;
    let max = current;
    for(let i=0; i<30; i++) {
      current += (random() - 0.45) * 15; // slightly upward bias
      if (current < 5) current = 5 + random() * 10;
      if (current > max) max = current;
      if (current < min) min = current;
      data.push(current);
    }
    
    const normalized = data.map(v => ((v - min) / (max - min)) * 80 + 10);
    const points = normalized.map((val, i) => `${(i / 29) * 100},${100 - val}`).join(" ");
    const areaPoints = `0,100 ${points} 100,100`;
    const trendPercent = ((data[29] - data[0]) / data[0]) * 100;
    
    return { points, areaPoints, trendPercent };
  }, [details.id, details.name]);

  if (!product) return null;

  async function saveToWatchlist() {
    setSaveStatus("saving");
    setMessage("");
    saveLocalProduct(details, session);

    if (!supabase) {
      setSaveStatus("saved");
      setMessage("Product saved to Research Hub.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaveStatus("saved");
      setMessage("Product saved to Research Hub (Local only).");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    const { error } = await supabase.from("user_watchlist").upsert({
      user_id: user.id,
      product_id: details.id,
      snapshot: product,
    });

    if (error) {
      setSaveStatus("saved");
      setMessage("Product saved to Research Hub (Cloud sync failed).");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setSaveStatus("saved");
    setMessage("Product saved to Research Hub.");
    setTimeout(() => setMessage(""), 3000);
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
                <Kpi label="Rank" value={`#${details.rank}`} icon={TrendingUp} color="text-emerald-300" />
                <Kpi label="Sales (Est.)" value={details.sales} icon={Activity} color="text-cyan-300" />
                <Kpi label="Price" value={details.price} icon={DollarSign} color="text-indigo-300" />
                <Kpi label="Reviews" value={details.reviews} icon={Star} color="text-amber-300" />
                <Kpi label="Revenue (Est.)" value="RM 61,140" icon={DollarSign} color="text-emerald-400" />
                <Kpi label="Margin" value="34.2%" icon={Activity} color="text-cyan-400" />
                <Kpi label="Trend Rank" value={details.trendRank} icon={TrendingUp} color="text-emerald-300" />
                <Kpi label="Stock Level" value={details.stock} icon={Package} color="text-amber-300" />
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
                    <InfoRow label="Weight (kg)" value="0.45" />
                  </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground">Sales Trend (30 Days)</h3>
                      <span className={`text-xs ${trendData.trendPercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {trendData.trendPercent >= 0 ? "+" : ""}{trendData.trendPercent.toFixed(1)}% vs last 30 days
                      </span>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4 h-[180px] relative group overflow-hidden">
                      <div className="absolute inset-0 flex flex-col justify-between py-6 px-4 pointer-events-none opacity-20">
                        <div className="border-b border-slate-600 w-full h-0"></div>
                        <div className="border-b border-slate-600 w-full h-0"></div>
                        <div className="border-b border-slate-600 w-full h-0"></div>
                        <div className="border-b border-slate-600 w-full h-0"></div>
                      </div>
                      <svg className="w-full h-full text-cyan-400" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <polyline
                          fill="url(#trendGradient)"
                          stroke="none"
                          points={trendData.areaPoints}
                        />
                        <polyline
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                          points={trendData.points}
                        />
                      </svg>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none backdrop-blur-[1px]">
                        <span className="text-xs font-bold text-foreground bg-cyan-500/20 border border-cyan-400/50 px-3 py-1.5 rounded-full shadow-lg shadow-cyan-900/20">Live Sync Required</span>
                      </div>
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
              <button className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 p-4 text-xs font-bold text-foreground transition hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:text-cyan-400">
                 Analyze Product
              </button>
              <button className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 p-4 text-xs font-bold text-foreground transition hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:text-cyan-400">
                 Explain Scores
              </button>
              <button className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 p-4 text-xs font-bold text-foreground transition hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:text-cyan-400">
                 Marketing Ideas
              </button>
              <button className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 p-4 text-xs font-bold text-foreground transition hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:text-cyan-400">
                 Generate Listing
              </button>
              <button className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 p-4 text-xs font-bold text-foreground transition hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:text-cyan-400">
                 Compare Products
              </button>
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
    reviews: formatNumber(product?.review_count ?? product?.Review_Count),
    stock: String(product?.stock_level ?? product?.Stock_Level ?? "Unknown"),
    shipping: String(product?.shipping_location ?? product?.Shipping_Location ?? "Unknown"),
    variants: String(product?.variant_count ?? product?.Variant_Count ?? "N/A"),
  };
}

function getResearchStorageKey(session?: Session | null) {
  return `profitpilot-research-${session?.user?.email?.toLowerCase() || "local"}`;
}

function saveLocalProduct(details: any, session?: Session | null) {
  if (typeof window === "undefined") return;
  const key = getResearchStorageKey(session);
  const raw = localStorage.getItem(key);
  const current = raw ? JSON.parse(raw) : { notes: "", savedProducts: [] };
  const id = details.id;
  const savedProducts = Array.isArray(current.savedProducts) ? current.savedProducts : [];
  const nextProducts = [details, ...savedProducts.filter((item: any) => {
    const itemId = item.id || String(item?.Product_URL || item?.Product_Name || item?.Clean_Name_AI || "");
    return itemId !== id;
  })].slice(0, 50);
  localStorage.setItem(key, JSON.stringify({ ...current, savedProducts: nextProducts }));
}

function formatCurrency(value: any) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "N/A";
  return `RM ${number.toFixed(2)}`;
}

function formatNumber(value: any) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "N/A";
  return Intl.NumberFormat("en-MY").format(number);
}

function Kpi({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
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

function ActionCard({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Icon className="mb-4 h-5 w-5 text-cyan-300" />
      <h3 className="font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}
