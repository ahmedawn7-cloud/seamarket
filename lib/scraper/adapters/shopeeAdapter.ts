import { BaseAdapter } from "./baseAdapter";
import { applyRateLimit } from "../core/rateLimiter";

export class ShopeeAdapter extends BaseAdapter {
  constructor() {
    super("Shopee");
  }

  async fetchProducts(limit: number): Promise<any[]> {
    console.log(`[ShopeeAdapter] Fetching ${limit} products...`);
    // Simulated delay for scraping
    await applyRateLimit(1500); 

    // Generate mock Shopee data for architecture validation
    const mockData = Array.from({ length: limit }).map((_, i) => ({
      name: `Shopee Best Seller Item ${i + 1} - High Quality! 🚀`,
      url: `https://shopee.com.my/product/12345/6789${i}`,
      image: `https://cf.shopee.com.my/file/fake_image_${i}.jpg`,
      price: (Math.random() * 100 + 10).toFixed(2),
      sales: Math.floor(Math.random() * 5000),
      rating: (Math.random() * 1 + 4).toFixed(1),
      reviews: Math.floor(Math.random() * 1000),
      shop_name: `ShopeeStore_${i}`,
      location: i % 2 === 0 ? "Selangor" : "Kuala Lumpur",
      category: "Home & Living",
    }));

    return mockData;
  }
}
