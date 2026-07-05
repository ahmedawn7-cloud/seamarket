import { getServiceSupabaseClient } from "@/lib/supabase/serviceRoleClient";
import { ProductScrapeRecord } from "../types/ProductScrapeRecord";

function getServiceSupabase() {
  return getServiceSupabaseClient();
}

export async function saveProductsToSupabase(products: ProductScrapeRecord[]): Promise<{ saved: number; failed: number }> {
  if (!products || products.length === 0) return { saved: 0, failed: 0 };
  
  const supabase = getServiceSupabase();
  let saved = 0;
  let failed = 0;

  // For deduplication, we check platform + product_url + date(scrape_date)
  // In Supabase we don't have a unique constraint on those 3 natively yet, so we will do a manual check or upsert.
  // The simplest reliable way without a unique constraint is to query first, then insert/update.
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  for (const product of products) {
    try {
      // Find existing
      const { data: existing, error: searchError } = await supabase
        .from("scraped_products")
        .select("id")
        .eq("platform", product.platform)
        .eq("product_url", product.product_url)
        .gte("scrape_date", `${today}T00:00:00Z`)
        .lte("scrape_date", `${today}T23:59:59Z`)
        .limit(1)
        .maybeSingle();

      if (searchError) {
        console.error("Error searching for duplicate:", searchError);
        failed++;
        continue;
      }

      if (existing && existing.id) {
        // UPDATE
        const { error: updateError } = await supabase
          .from("scraped_products")
          .update(product)
          .eq("id", existing.id);
          
        if (updateError) {
          console.error("Update error:", updateError);
          failed++;
        } else {
          saved++;
        }
      } else {
        // INSERT
        const { error: insertError } = await supabase
          .from("scraped_products")
          .insert(product);
          
        if (insertError) {
          console.error("Insert error:", insertError);
          failed++;
        } else {
          saved++;
        }
      }
    } catch (err) {
      console.error("Exception saving product:", err);
      failed++;
    }
  }

  return { saved, failed };
}
