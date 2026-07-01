"use client";

import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Activity,
  BarChart3,
  Bell,
  Bookmark,
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
  onClose,
  onResearch,
}: {
  product: any;
  onClose: () => void;
  onResearch?: (product: any) => void;
}) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const details = useMemo(() => normalizeProduct(product), [product]);

  if (!product) return null;

  async function saveToWatchlist() {
    setSaveStatus("saving");
    setMessage("");

    if (!supabase) {
      setSaveStatus("error");
      setMessage("Supabase is not configured.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaveStatus("error");
      setMessage("Login is required before saved research can sync to your account.");
      return;
    }

    const { error } = await supabase.from("user_watchlist").upsert({
      user_id: user.id,
      product_id: details.id,
      snapshot: product,
    });

    if (error) {
      setSaveStatus("error");
      setMessage(error.message);
      return;
    }

    setSaveStatus("saved");
    setMessage("Saved to your research watchlist.");
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <aside className="relative flex h-full w-full max-w-3xl flex-col overflow-y-auto border-l border-cyan-400/20 bg-[#070b16] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-800 bg-[#070b16]/92 p-6 backdrop-blur-md">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
              Product analytics terminal
            </p>
            <h2 className="text-xl font-bold leading-tight text-white">{details.name}</h2>
            <p className="mt-2 text-sm text-slate-500">{details.platform} / {details.category}</p>
          </div>

          <button onClick={onClose} className="rounded-lg bg-[#101827] p-2 text-slate-400 transition hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-8 p-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Kpi label="Rank" value={`#${details.rank}`} icon={TrendingUp} color="text-emerald-300" />
            <Kpi label="Sales" value={details.sales} icon={Activity} color="text-cyan-300" />
            <Kpi label="Price" value={details.price} icon={DollarSign} color="text-indigo-300" />
            <Kpi label="Reviews" value={details.reviews} icon={Star} color="text-amber-300" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1fr]">
            <div className="h-72 overflow-hidden rounded-xl border border-slate-800 bg-[#0d1322]">
              {details.imageUrl ? (
                <img src={details.imageUrl} alt={details.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-slate-500">
                  <ImageOff className="mb-3 h-10 w-10" />
                  No image available
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5">
                <h3 className="mb-4 font-bold text-white">Market snapshot</h3>
                <InfoRow label="Stock level" value={details.stock} />
                <InfoRow label="Shipping location" value={details.shipping} />
                <InfoRow label="Variants" value={details.variants} />
                <InfoRow label="Trend rank" value={details.trendRank} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={saveToWatchlist}
                  disabled={saveStatus === "saving"}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
                >
                  <Bookmark className="h-4 w-4" />
                  {saveStatus === "saving" ? "Saving..." : "Save research"}
                </button>

                <button
                  onClick={() => onResearch?.(product)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:border-cyan-400"
                >
                  <Scale className="h-4 w-4" />
                  Research deeper
                </button>
              </div>

              {details.productUrl && (
                <a
                  href={details.productUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-black/20 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-cyan-400"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open marketplace listing
                </a>
              )}

              {message && (
                <div
                  className={`rounded-lg border p-3 text-sm ${
                    saveStatus === "saved"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {message}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ActionCard icon={BarChart3} title="Track performance" text="Watch price, sales, reviews, and trend movement over time." />
            <ActionCard icon={Bell} title="Create alert" text="Later: notify users when a product spikes, drops, or gets saturated." />
            <ActionCard icon={Package} title="Move to sourcing" text="Send this product into the sourcing workspace for supplier comparison." />
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5">
            <h3 className="mb-3 font-bold text-white">AI decision notes</h3>
            <div className="space-y-3 text-sm leading-6 text-slate-400">
              <p>
                <strong className="text-slate-200">Opportunity:</strong> Use sales velocity, reviews, price, and rank to decide whether this product deserves sourcing research.
              </p>
              <p>
                <strong className="text-slate-200">Next check:</strong> Compare supplier cost, shipping speed, saturation, and whether the product can be demonstrated clearly in short video.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function normalizeProduct(product: any) {
  const name =
    product?.Clean_Name_AI ||
    product?.clean_name_ai ||
    product?.Product_Name ||
    product?.product_name ||
    "Unknown product";

  return {
    id: String(product?.id || product?.Product_URL || product?.Product_Name || name),
    name,
    imageUrl: product?.Image_URL || product?.image_url,
    productUrl: product?.Product_URL || product?.product_url,
    platform: product?.Platform || product?.platform || "Marketplace",
    category: product?.Category || product?.category || "Uncategorized",
    rank: product?.Rank ?? product?.rank ?? product?.Internal_Rank ?? "N/A",
    trendRank: String(product?.Trend_Rank ?? product?.trend_rank ?? product?.Internal_Rank ?? "N/A"),
    price: formatCurrency(product?.Price_RM ?? product?.price ?? product?.Price),
    sales: formatNumber(product?.Sales ?? product?.sales),
    reviews: formatNumber(product?.Review_Count ?? product?.review_count),
    stock: String(product?.Stock_Level ?? product?.stock_level ?? "Unknown"),
    shipping: String(product?.Shipping_Location ?? product?.shipping_location ?? "Unknown"),
    variants: String(product?.Variant_Count ?? product?.variant_count ?? "N/A"),
  };
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
    <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-4">
      <Icon className={`mb-3 h-5 w-5 ${color}`} />
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
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