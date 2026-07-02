"use client";

import { ExternalLink, Eye, Heart, ImageOff, Star, TrendingUp } from "lucide-react";

type ProductCardProps = {
  product: any;
  onResearch: (product: any) => void;
  onQuickView: (product: any) => void;
};

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const details = normalizeProduct(product);

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-800 bg-[#0d1322] shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-cyan-500/10">
      <div className="relative h-48 bg-black/30">
        {details.imageUrl ? (
          <img
            src={details.imageUrl}
            alt={details.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-slate-500">
            <ImageOff className="mb-2 h-8 w-8" />
            <span className="text-sm">No image</span>
          </div>
        )}

        <div className="absolute left-3 top-3 rounded-full bg-black/75 px-3 py-1 text-xs font-bold text-white backdrop-blur shadow-sm">
          Rank #{details.rank}
        </div>

        <button className="absolute right-3 top-3 p-2 text-slate-300 transition hover:text-white hover:scale-110 drop-shadow-md">
          <Heart className="h-5 w-5" />
        </button>
        
        <div className="absolute left-3 bottom-3 rounded-md bg-black/80 px-2 py-1 text-[10px] font-bold text-slate-200 backdrop-blur shadow-sm">
          {details.platform}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="truncate text-sm font-bold leading-6 text-white">{details.name}</h3>
          <p className="mt-1 text-xs text-slate-500">{details.category}</p>
        </div>

        <div className="grid grid-cols-4 gap-2 border-b border-slate-800 pb-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500">Price</span>
            <span className="text-xs font-bold text-white">{details.price}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500">Sales (Est.)</span>
            <span className="text-xs font-bold text-white">{details.sales}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500">Revenue (Est.)</span>
            <span className="text-xs font-bold text-white">RM 61K</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500">Margin</span>
            <span className="text-xs font-bold text-emerald-400">34%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onQuickView(product)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500/10 px-3 py-2.5 text-xs font-bold text-cyan-400 transition hover:bg-cyan-500/20"
          >
            <Eye className="h-4 w-4" />
            Analyze
          </button>

          <button
            onClick={() => onQuickView(product)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-transparent px-3 py-2.5 text-xs font-bold text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            Quick View
          </button>
        </div>
      </div>
    </article>
  );
}

function normalizeProduct(product: any) {
  return {
    name:
      product.Clean_Name_AI ||
      product.clean_name_ai ||
      product.Product_Name ||
      product.product_name ||
      "Unknown product",
    imageUrl: product.Image_URL || product.image_url,
    productUrl: product.Product_URL || product.product_url,
    platform: getProductPlatform(product),
    category: product.Category || product.category || "Uncategorized",
    rank: product.Rank ?? product.rank ?? product.Internal_Rank ?? "N/A",
    trendRank: product.Trend_Rank ?? product.trend_rank ?? product.Internal_Rank ?? "N/A",
    price: formatCurrency(product.Price_RM ?? product.price ?? product.Price),
    sales: formatNumber(product.Sales ?? product.sales),
    reviews: formatNumber(product.Review_Count ?? product.review_count),
    rating: product.Rating_Score ?? product.rating_score ?? "N/A",
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

function getProductPlatform(product: any) {
  const explicitPlatform = product.Platform || product.platform;
  if (explicitPlatform) return String(explicitPlatform);

  const searchable = `${product.Product_URL || ""} ${product.Store_Name || ""} ${product.Category || ""}`.toLowerCase();

  if (searchable.includes("shopee")) return "Shopee";
  if (searchable.includes("lazada")) return "Lazada";
  if (searchable.includes("tiktok") || searchable.includes("tikaka")) return "TikTok Shop";

  return "Marketplace";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-black/20 px-2 py-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 truncate text-xs font-bold text-white">{value}</p>
    </div>
  );
}
