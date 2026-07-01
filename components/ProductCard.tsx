"use client";

import { ExternalLink, Eye, ImageOff, Star, TrendingUp } from "lucide-react";

type ProductCardProps = {
  product: any;
  onResearch: (product: any) => void;
  onQuickView: (product: any) => void;
};

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const details = normalizeProduct(product);

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-800 bg-[#0d1322] shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-cyan-500/10">
      <div className="relative h-52 bg-black/30">
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

        <div className="absolute left-3 top-3 rounded-full bg-black/75 px-3 py-1 text-xs font-bold text-white backdrop-blur">
          Rank #{details.rank}
        </div>

        <div className="absolute right-3 top-3 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200 backdrop-blur">
          {details.platform}
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <h3 className="line-clamp-2 min-h-[3rem] text-sm font-bold leading-6 text-white">{details.name}</h3>
          <p className="mt-2 text-xs text-slate-500">{details.category}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Metric label="Price" value={details.price} />
          <Metric label="Sales" value={details.sales} />
          <Metric label="Reviews" value={details.reviews} />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-black/20 px-3 py-2">
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Star className="h-3.5 w-3.5 text-cyan-300" />
            {details.rating}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
            <TrendingUp className="h-3.5 w-3.5" />
            Trend {details.trendRank}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onQuickView(product)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            <Eye className="h-4 w-4" />
            Analyze
          </button>

          {details.productUrl ? (
            <a
              href={details.productUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-cyan-400"
            >
              <ExternalLink className="h-4 w-4" />
              Open
            </a>
          ) : (
            <button className="rounded-lg border border-slate-700 bg-white/5 px-3 py-2 text-xs font-bold text-slate-400">
              No link
            </button>
          )}
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
    platform: product.Platform || product.platform || "Marketplace",
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-black/20 px-2 py-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 truncate text-xs font-bold text-white">{value}</p>
    </div>
  );
}