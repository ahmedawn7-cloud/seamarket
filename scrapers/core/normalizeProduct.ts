export interface RawProduct {
  platform: string;
  product_name: string;
  image_url: string;
  product_url: string;
  price_rm: number | null;
  sales: number | null;
  rating_score: number | null;
  review_count: number | null;
  category: string;
  location?: string | null;
  brand?: string | null;
  variant_count?: number | null;
  stock_level?: number | null;
  video_url?: string | null;
  initial_price_low?: number | null;
  source_keyword?: string | null;
  source_category?: string | null;
  source_url?: string | null;
  raw_platform_data?: any;
}

export interface NormalizedProduct extends RawProduct {
  clean_name_ai: string | null;
  trend_rank: number | null;
  platform_fee_pct: number | null;
  competition_score: number | null;
  opportunity_score: number | null;
  risk_score: number | null;
  supplier_availability_score: number | null;
  regulatory_risk_score: number | null;
  trend_score: number | null;
}

export function normalizeProduct(raw: RawProduct): NormalizedProduct {
  // basic normalization
  return {
    ...raw,
    product_name: raw.product_name.trim(),
    product_url: raw.product_url.trim(),
    clean_name_ai: null, // Will be filled later by cleaner bot
    trend_rank: null,
    platform_fee_pct: null,
    competition_score: null,
    opportunity_score: null,
    risk_score: null,
    supplier_availability_score: null,
    regulatory_risk_score: null,
    trend_score: null
  };
}
