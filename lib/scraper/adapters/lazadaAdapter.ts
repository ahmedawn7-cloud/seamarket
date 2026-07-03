import { BaseAdapter } from "./baseAdapter";
import { applyRateLimit } from "../core/rateLimiter";

export class LazadaAdapter extends BaseAdapter {
  constructor() {
    super("Lazada");
  }

  async fetchProducts(limit: number): Promise<any[]> {
    console.log(`[LazadaAdapter] Fetching ${limit} products...`);
    await applyRateLimit(1500); 

    const mockData = Array.from({ length: limit }).map((_, i) => ({
      title: `Lazada Top Choice Product ${i + 1}`,
      link: `https://www.lazada.com.my/products/item-i12345${i}.html`,
      image_url: `https://lzd-img-global.slatic.net/fake_img_${i}.jpg`,
      price: (Math.random() * 150 + 20).toFixed(2),
      sales: Math.floor(Math.random() * 2000),
      rating: (Math.random() * 1 + 3.5).toFixed(1),
      reviews: Math.floor(Math.random() * 500),
      store: `LazMall_Store_${i}`,
      location: "Kuala Lumpur",
      category: "Electronics",
      brand: `BrandX_${i}`,
    }));

    return mockData;
  }
}
