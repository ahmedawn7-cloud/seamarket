export interface ProductScrapeRecord {
  id?: string;
  scrape_date?: Date;
  platform: string;
  internal_rank?: number;
  rank?: number;
  trend_rank?: number;
  clean_name_ai?: string;
  product_name: string;
  image_url?: string;
  product_url: string;
  variant_count?: number;
  sales?: number;
  price_rm?: number;
  shipping_location?: string;
  stock_level?: number;
  rating_score?: number;
  review_count?: number;
  video_url?: string;
  discount_percent?: number;
  store_name?: string;
  category?: string;
  brand?: string;
  initial_price_low?: number;
  final_price_low?: number;
  affiliate_link?: string;
  raw_payload?: any;
  scrape_status?: string;
}

export interface ScraperRunLog {
  id?: string;
  started_at?: Date;
  finished_at?: Date | null;
  platform: string;
  status: "running" | "completed" | "failed";
  requested_limit: number;
  products_found: number;
  products_saved: number;
  products_failed: number;
  error_message?: string;
  metadata?: any;
}
