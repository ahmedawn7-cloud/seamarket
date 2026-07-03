"use client";

import { useMemo, useState } from "react";
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

  if (!product) return null;

  async function saveToWatchlist() {
    setSaveStatus("saving");
    setMessage("");
    saveLocalProduct(product, session);

    if (!supabase) {
      setSaveStatus("saved");
      setMessage("Saved locally to your research workspace.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaveStatus("saved");
      setMessage("Saved locally. Login is required for cloud sync.");
      return;
    }

    const { error } = await supabase.from("user_watchlist").upsert({
      user_id: user.id,
      product_id: details.id,
      snapshot: product,
    });

    if (error) {
      setSaveStatus("saved");
      setMessage(`Saved locally. Cloud sync needs user_watchlist setup: ${error.message}`);
      return;
    }

    setSaveStatus("saved");
    setMessage("Saved to your research watchlist.");
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <aside className="relative flex h-full w-full max-w-4xl flex-col overflow-y-auto border-l border-cyan-400/20 bg-[#070b16] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-800 bg-[#070b16]/92 p-6 backdrop-blur-md">
          <div>
            <h2 className="text-2xl font-bold leading-tight text-white">{details.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{details.platform} / {details.category}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveToWatchlist}
              disabled={saveStatus === "saving"}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#101827] px-3 py-2 text-sm font-bold text-slate-300 transition hover:border-cyan-400 hover:text-white"
            >
              <Bookmark className="h-4 w-4" />
              Save Product
            </button>
            <button onClick={onClose} className="rounded-lg bg-[#101827] p-2 text-slate-400 transition hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex w-full flex-col gap-3 lg:w-1/3">
              <div className="h-64 overflow-hidden rounded-xl border border-slate-800 bg-[#0d1322]">
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
                  <div key={i} className="h-14 w-1/4 rounded-lg border border-slate-800 bg-[#0d1322]"></div>
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

              <div className="mt-6 border-b border-slate-800">
                <div className="flex gap-6 overflow-x-auto pb-4">
                  {["Overview", "Market", "Analytics", "Sourcing", "AI Insights", "History"].map((tab, idx) => (
                    <button
                      key={tab}
                      className={`shrink-0 text-sm font-medium transition ${
                        idx === 0
                          ? "border-b-2 border-cyan-400 pb-4 -mb-[17px] text-cyan-400"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white">Market Snapshot</h3>
                  <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-4">
                    <InfoRow label="Category" value={details.category} />
                    <InfoRow label="Shipping Location" value={details.shipping} />
                    <InfoRow label="Variants" value={details.variants} />
                    <InfoRow label="Weight (kg)" value="0.45" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Sales Trend (30 Days)</h3>
                    <span className="text-xs text-emerald-400">+18.4% vs last 30 days</span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-4 h-[180px] flex items-end justify-center relative">
                    <svg className="w-full h-full text-cyan-400" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        points="0,35 10,32 20,25 30,28 40,15 50,20 60,10 70,12 80,5 90,8 100,2"
                      />
                      <polyline
                        fill="currentColor"
                        fillOpacity="0.1"
                        stroke="none"
                        points="0,40 0,35 10,32 20,25 30,28 40,15 50,20 60,10 70,12 80,5 90,8 100,2 100,40"
                      />
                    </svg>
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
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#0d1322] px-4 py-3 text-sm font-bold text-white transition hover:border-cyan-400"
              >
                <Package className="h-4 w-4" />
                Source Product
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
              
              {showSourcing && (
                <div className="absolute left-0 top-full mt-2 w-full rounded-xl border border-slate-700 bg-[#0d1322] p-2 shadow-xl shadow-black/50 z-20">
                  {["1688", "Alibaba", "CJ Dropshipping", "Taobao"].map((src) => (
                    <button
                      key={src}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
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
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#0d1322] px-4 py-3 text-sm font-bold text-white transition hover:border-cyan-400"
              >
                <ExternalLink className="h-4 w-4" />
                Open Marketplace
              </a>
            ) : (
              <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#0d1322] px-4 py-3 text-sm font-bold text-slate-500 cursor-not-allowed">
                Open Marketplace
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5">
            <div className="flex gap-4 border-b border-slate-800 pb-4 mb-4 text-sm text-slate-400">
              <span className="text-cyan-400 border-b border-cyan-400 -mb-[17px] pb-4 font-medium">AI Insights</span>
              <span>Supplier Intel</span>
              <span>Competitor View</span>
              <span>Listing Analyzer</span>
            </div>
            <div className="space-y-4 text-sm leading-6 text-slate-300">
              <div className="flex gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                <p>Strong upward trend in sales over the past 2 weeks. Low competition with high demand.</p>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-cyan-400 shrink-0" />
                <p>Opportunity: Bundle with fitness accessories to increase AOV.</p>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                <p>Next step: Consider sourcing from verified suppliers in China.</p>
              </div>
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

function saveLocalProduct(product: any, session?: Session | null) {
  if (typeof window === "undefined") return;
  const key = getResearchStorageKey(session);
  const raw = localStorage.getItem(key);
  const current = raw ? JSON.parse(raw) : { notes: "", savedProducts: [] };
  const id = String(product?.id || product?.Product_URL || product?.Product_Name || product?.Clean_Name_AI || Date.now());
  const savedProducts = Array.isArray(current.savedProducts) ? current.savedProducts : [];
  const nextProducts = [product, ...savedProducts.filter((item: any) => {
    const itemId = String(item?.id || item?.Product_URL || item?.Product_Name || item?.Clean_Name_AI || "");
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
    <div className="flex items-center justify-between border-b border-slate-800 py-3 last:border-b-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  );
}

function ActionCard({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5">
      <Icon className="mb-4 h-5 w-5 text-cyan-300" />
      <h3 className="font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}
