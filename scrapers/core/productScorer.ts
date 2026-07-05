import { NormalizedProduct } from "./normalizeProduct";

export function scoreProduct(product: NormalizedProduct): NormalizedProduct {
  let trendScore = 0;
  
  // Sales velocity signal (heuristic: sales > 1000 is good)
  if (product.sales && product.sales > 100) trendScore += 20;
  if (product.sales && product.sales > 1000) trendScore += 30;
  
  // Review count signal
  if (product.review_count && product.review_count > 50) trendScore += 10;
  if (product.review_count && product.review_count > 500) trendScore += 10;
  
  // Rating quality signal
  if (product.rating_score && product.rating_score >= 4.5) trendScore += 15;
  if (product.rating_score && product.rating_score >= 4.8) trendScore += 5;
  
  // Price affordability signal (impulse buy range 20-100 RM is usually good)
  if (product.price_rm && product.price_rm >= 15 && product.price_rm <= 100) trendScore += 10;
  
  // Category priority (Viral / trending categories get a bump)
  const hotCategories = ["Beauty & Personal Care", "Health & Wellness", "Fashion Accessories"];
  if (product.category && hotCategories.includes(product.category)) trendScore += 10;

  // Keyword trend match
  if (product.source_keyword && (product.source_keyword.includes("viral") || product.source_keyword.includes("trending"))) {
    trendScore += 10;
  }

  // Cap at 100
  trendScore = Math.min(100, trendScore);
  
  // Basic opportunity score calculation
  let oppScore = trendScore;
  // If price is high, maybe better margins
  if (product.price_rm && product.price_rm > 50) oppScore += 5;
  
  // Normalize missing data gracefully
  product.trend_score = trendScore;
  product.opportunity_score = Math.min(100, oppScore);
  
  return product;
}

export function deduplicateProducts(products: NormalizedProduct[]): NormalizedProduct[] {
  const seenUrls = new Map<string, NormalizedProduct>();
  
  for (const product of products) {
    // Basic deduplication by exact URL
    const existing = seenUrls.get(product.product_url);
    if (!existing) {
      seenUrls.set(product.product_url, product);
    } else {
      // Keep the one with higher sales if duplicate URL found (though URL should be unique)
      const currentSales = existing.sales || 0;
      const newSales = product.sales || 0;
      if (newSales > currentSales) {
        seenUrls.set(product.product_url, product);
      }
    }
  }

  // Next level: deduplicate by exact name + platform (likely duplicate listing)
  const seenNames = new Map<string, NormalizedProduct>();
  for (const product of Array.from(seenUrls.values())) {
    const key = `${product.platform}_${product.product_name.toLowerCase()}`;
    const existing = seenNames.get(key);
    if (!existing) {
      seenNames.set(key, product);
    } else {
      const currentSales = existing.sales || 0;
      const newSales = product.sales || 0;
      if (newSales > currentSales) {
        seenNames.set(key, product);
      }
    }
  }

  return Array.from(seenNames.values());
}
