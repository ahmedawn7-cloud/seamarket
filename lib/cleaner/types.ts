export interface ScrapedProduct {
  id: string;
  scrape_date: string;
  platform: string;
  internal_rank: number | null;
  rank: number | null;
  trend_rank: number | null;
  clean_name_ai: string | null;
  product_name: string;
  image_url: string | null;
  product_url: string;
  variant_count: number | null;
  sales: number | null;
  price_rm: number | null;
  shipping_location: string | null;
  stock_level: number | null;
  rating_score: number | null;
  review_count: number | null;
  video_url: string | null;
  discount_percent: number | null;
  store_name: string | null;
  category: string | null;
  brand: string | null;
  initial_price_low: number | null;
  final_price_low: number | null;
  affiliate_link: string | null;
  raw_payload: any;
  scrape_status: string;
  created_at: string;
  updated_at: string;
}

export interface CleanedProduct {
  scraped_product_id: string;
  platform: string;
  original_product_name: string;
  clean_name_ai: string;
  translated_name: string;
  normalized_brand: string | null;
  normalized_category: string;
  product_type: string | null;
  language: string;
  keywords: string[];
  duplicate_group: string;
  is_duplicate: boolean;
  image_hash: string | null;
  product_url: string;
  image_url: string | null;
  validation_status: "valid" | "warning" | "invalid";
  validation_errors: string[];
  confidence_score: number;
}
