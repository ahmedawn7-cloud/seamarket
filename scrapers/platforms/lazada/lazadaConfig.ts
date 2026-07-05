import { PlatformConfig } from "../../core/categoryConfig";

export const LAZADA_CONFIG: PlatformConfig = {
  platform: "Lazada",
  maxProductsPerPlatform: 100,
  maxCandidatesPerPlatform: 500,
  perPlatformTimeout: 5 * 60 * 1000,
  categories: [
    { category: "Beauty & Personal Care", targetCount: 20 },
    { category: "Home & Lifestyle", targetCount: 15 },
    { category: "Electronics Accessories", targetCount: 15 },
    { category: "Women/Men Fashion Accessories", targetCount: 10 },
    { category: "Mother & Baby", targetCount: 10 },
    { category: "Motors", targetCount: 10 },
    { category: "Sports & Outdoor", targetCount: 10 },
    { category: "Groceries", targetCount: 10 }
  ],
  keywords: [
    "viral",
    "trending",
    "best seller",
    "hot sale",
    "Lazada finds",
    "murah",
    "popular",
    "Malaysia best seller",
    "new arrival",
    "home must have"
  ],
  seedUrls: [
    "https://www.lazada.com.my/catalog/?q=viral",
    "https://www.lazada.com.my/catalog/?q=trending"
  ]
};
