export interface ProductIntake {
  id: string;
  week_label: string;
  product_name: string;
  platform: string;
  product_url: string;
  image_url: string;
  category: string;
  price_rm: number;
  approximate_sales: number;
  rating_score: number;
  review_count: number;
  source_keyword: string;
  notes: string;
}

export interface BotContext {
  product: ProductIntake;
}
