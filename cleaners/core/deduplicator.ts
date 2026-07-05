import { v4 as uuidv4 } from "uuid";

export interface CleanProductCandidate {
  scraped_product_id: string;
  product_url: string;
  image_url: string;
  product_name: string;
  clean_name_ai: string;
  platform: string;
  normalized_category: string;
  price_rm: number | null;
  sales: number | null;
  rating_score: number | null;
  review_count: number | null;
  duplicate_group?: string;
  is_duplicate?: boolean;
  scrape_date: Date;
  [key: string]: any; // other fields
}

export function deduplicateCleanProducts(products: CleanProductCandidate[]): CleanProductCandidate[] {
  // We'll cluster products into groups
  const groups: CleanProductCandidate[][] = [];

  for (const product of products) {
    let foundGroup = false;

    // Check against existing groups
    for (const group of groups) {
      const rep = group[0];
      
      const sameUrl = product.product_url === rep.product_url;
      const sameImage = product.image_url && product.image_url !== "null" && product.image_url === rep.image_url;
      const similarName = (product.clean_name_ai || product.product_name) === (rep.clean_name_ai || rep.product_name) && product.platform === rep.platform;

      if (sameUrl || sameImage || similarName) {
        group.push(product);
        foundGroup = true;
        break;
      }
    }

    if (!foundGroup) {
      groups.push([product]);
    }
  }

  const finalProducts: CleanProductCandidate[] = [];

  // Evaluate each group to find the "strongest" product
  for (const group of groups) {
    const groupId = uuidv4();
    
    if (group.length === 1) {
      const p = group[0];
      p.duplicate_group = groupId;
      p.is_duplicate = false;
      finalProducts.push(p);
      continue;
    }

    // Score each product in the group to find the best one
    let bestProductIndex = 0;
    let bestScore = -1;

    group.forEach((p, index) => {
      let score = 0;
      if (p.sales) score += p.sales * 0.1; // Sales weight
      if (p.rating_score) score += p.rating_score * 100;
      if (p.review_count) score += p.review_count * 5;
      
      // Completeness score
      if (p.price_rm) score += 50;
      if (p.clean_name_ai) score += 100;
      
      // Freshness score (small bump for newer)
      const daysOld = (new Date().getTime() - new Date(p.scrape_date).getTime()) / (1000 * 3600 * 24);
      score -= daysOld * 2; 

      if (score > bestScore) {
        bestScore = score;
        bestProductIndex = index;
      }
    });

    // Mark all, set the best one to is_duplicate = false
    group.forEach((p, index) => {
      p.duplicate_group = groupId;
      p.is_duplicate = index !== bestProductIndex;
      finalProducts.push(p);
    });
  }

  return finalProducts;
}
