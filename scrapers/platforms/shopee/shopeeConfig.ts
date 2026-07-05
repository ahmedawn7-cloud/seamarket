import { PlatformConfig } from "../../core/categoryConfig";

export const SHOPEE_CONFIG: PlatformConfig = {
  platform: "Shopee",
  maxProductsPerPlatform: 100,
  maxCandidatesPerPlatform: 500,
  perPlatformTimeout: 5 * 60 * 1000, // 5 minutes max per run
  categories: [
    { category: "Beauty & Personal Care", targetCount: 20 },
    { category: "Home & Living", targetCount: 15 },
    { category: "Electronics Accessories", targetCount: 15 },
    { category: "Fashion Accessories", targetCount: 10 },
    { category: "Baby & Kids", targetCount: 10 },
    { category: "Automotive Accessories", targetCount: 10 },
    { category: "Sports & Outdoor", targetCount: 10 },
    { category: "Food & Grocery", targetCount: 10 }
  ],
  keywords: [
    "viral",
    "trending",
    "hot selling",
    "best seller",
    "TikTok viral",
    "murah",
    "popular",
    "new arrival",
    "Shopee finds",
    "viral Malaysia"
  ],
  seedUrls: [
    // Add specific category pages or campaign pages here if search is blocked
    "https://shopee.com.my/search?keyword=viral",
    "https://shopee.com.my/search?keyword=trending"
  ]
};
