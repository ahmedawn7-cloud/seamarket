import { ProductScrapeRecord } from "../types/ProductScrapeRecord";

export function validateProduct(product: ProductScrapeRecord): boolean {
  if (!product.product_name || product.product_name.trim() === "") {
    return false;
  }
  if (!product.product_url || product.product_url.trim() === "") {
    return false;
  }
  if (!product.image_url || product.image_url.trim() === "" || !product.image_url.startsWith("http")) {
    return false;
  }
  return true;
}
