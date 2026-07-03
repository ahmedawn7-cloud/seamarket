import { ScrapedProduct, CleanedProduct } from "./types";

export function validateProduct(raw: ScrapedProduct, partialClean: Partial<CleanedProduct>) {
  const errors: string[] = [];
  let status: "valid" | "warning" | "invalid" = "valid";

  // Check Invalid criteria
  if (!raw.product_name) {
    errors.push("Missing product_name");
    status = "invalid";
  }
  if (!raw.product_url) {
    errors.push("Missing product_url");
    status = "invalid";
  }
  if (!raw.image_url) {
    errors.push("Missing image_url");
    status = "invalid";
  }

  // If already invalid, return early with current errors
  if (status === "invalid") {
    return { status, errors };
  }

  // Check Warning criteria
  if (!partialClean.normalized_brand) {
    errors.push("Missing brand");
    status = "warning";
  }
  if (!partialClean.normalized_category || partialClean.normalized_category === "Other") {
    errors.push("Missing or unmapped category");
    status = "warning";
  }
  if (raw.rating_score === null || raw.rating_score === undefined) {
    errors.push("Missing rating score");
    status = "warning";
  }
  if (raw.review_count === null || raw.review_count === undefined) {
    errors.push("Missing review count");
    status = "warning";
  }
  if (raw.sales === null || raw.sales === undefined) {
    errors.push("Missing sales");
    status = "warning";
  }

  return { status, errors };
}
