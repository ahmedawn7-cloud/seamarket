import { PlatformConfig } from "../../core/categoryConfig";

export const TIKTOK_CONFIG: PlatformConfig = {
  platform: "TikTok Shop",
  maxProductsPerPlatform: 100,
  maxCandidatesPerPlatform: 500,
  perPlatformTimeout: 5 * 60 * 1000,
  categories: [
    { category: "Beauty & Personal Care", targetCount: 25 },
    { category: "Fashion Accessories", targetCount: 15 },
    { category: "Home & Living", targetCount: 15 },
    { category: "Electronics Accessories", targetCount: 15 },
    { category: "Health & Wellness", targetCount: 10 },
    { category: "Baby & Kids", targetCount: 5 },
    { category: "Sports & Outdoor", targetCount: 5 },
    { category: "Food & Beverage", targetCount: 10 }
  ],
  keywords: [
    "TikTok viral",
    "viral product Malaysia",
    "TikTok Shop best seller",
    "trending now",
    "beauty viral",
    "home gadget viral",
    "TikTok made me buy it",
    "viral murah",
    "problem solving product"
  ],
  seedUrls: [
    // Seed URLs since TikTok Shop public search is heavily gated
    "https://shop.tiktok.com/view/product/1234567890",
    "https://shop.tiktok.com/view/product/0987654321",
    // Can be loaded from CSV or database later
  ]
};
