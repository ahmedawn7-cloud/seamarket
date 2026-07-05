import { getServiceSupabaseClient } from "@/lib/supabase/serviceRoleClient";
import { ProductScore } from "./types";

export async function saveProductScore(scores: Partial<ProductScore>[]) {
  const supabase = getServiceSupabaseClient();

  if (scores.length > 0) {
    const { error } = await supabase
      .from("product_scores")
      .upsert(scores, { onConflict: "cleaned_product_id", ignoreDuplicates: false });
    if (error) throw new Error(`Product Scores save failed: ${error.message}`);
  }
}
