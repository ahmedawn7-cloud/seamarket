import { ProductScrapeRecord } from "../types/ProductScrapeRecord";
import { normalizeProduct } from "../core/normalizer";

export abstract class BaseAdapter {
  protected platform: string;

  constructor(platform: string) {
    this.platform = platform;
  }

  abstract fetchProducts(limit: number): Promise<any[]>;

  public async getNormalizedProducts(limit: number): Promise<ProductScrapeRecord[]> {
    const rawData = await this.fetchProducts(limit);
    return rawData.map((raw, index) => normalizeProduct(raw, this.platform, index));
  }
}
