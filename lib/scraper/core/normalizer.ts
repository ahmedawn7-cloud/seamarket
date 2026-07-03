import { ProductScrapeRecord } from "../types/ProductScrapeRecord";

export function normalizeProductName(name: string): string {
  if (!name) return "";
  let clean = name.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/gu, "");
  clean = clean.replace(/\s+/g, " ");
  clean = clean.replace(/[^\w\s\.\,\-]/gi, ""); // Remove excessive punctuation, keep basic ones
  return clean.trim();
}

export function normalizeProduct(rawProduct: any, platform: string, index: number): ProductScrapeRecord {
  const clean_name = normalizeProductName(rawProduct.name || rawProduct.title || "");
  
  return {
    platform,
    internal_rank: index + 1,
    product_name: rawProduct.name || rawProduct.title || "Unknown Product",
    clean_name_ai: clean_name,
    product_url: rawProduct.url || rawProduct.link || "",
    image_url: rawProduct.image || rawProduct.image_url || undefined,
    price_rm: rawProduct.price ? parseFloat(rawProduct.price) : undefined,
    sales: rawProduct.sales ? parseInt(rawProduct.sales, 10) : undefined,
    rating_score: rawProduct.rating ? parseFloat(rawProduct.rating) : undefined,
    review_count: rawProduct.reviews ? parseInt(rawProduct.reviews, 10) : undefined,
    store_name: rawProduct.shop_name || rawProduct.store || undefined,
    shipping_location: rawProduct.location || undefined,
    category: rawProduct.category || "Uncategorized",
    brand: rawProduct.brand || undefined,
    raw_payload: rawProduct,
    scrape_status: "normalized",
  };
}
