import { BaseAdapter } from "./baseAdapter";
import { applyRateLimit } from "../core/rateLimiter";

export class TikTokAdapter extends BaseAdapter {
  constructor() {
    super("TikTok Shop");
  }

  async fetchProducts(limit: number): Promise<any[]> {
    console.log(`[TikTokAdapter] Fetching ${limit} products...`);
    await applyRateLimit(1500); 

    const mockData = Array.from({ length: limit }).map((_, i) => ({
      name: `TikTok Viral Product ${i + 1} #fyp`,
      url: `https://shop.tiktok.com/view/product/${i}123456`,
      image: `https://p16-oec-sg.ibyteimg.com/fake_img_${i}.jpeg`,
      price: (Math.random() * 80 + 5).toFixed(2),
      sales: Math.floor(Math.random() * 10000), // TikTok has high volume
      rating: (Math.random() * 0.5 + 4.5).toFixed(1),
      reviews: Math.floor(Math.random() * 3000),
      shop_name: `CreatorStore_${i}`,
      category: "Beauty & Personal Care",
    }));

    return mockData;
  }
}
