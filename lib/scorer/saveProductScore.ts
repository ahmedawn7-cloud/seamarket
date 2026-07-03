import { createClient } from "@supabase/supabase-js";
import { ProductScore } from "./types";

export async function saveProductScore(scores: Partial<ProductScore>[]) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  if (scores.length > 0) {
    const { error } = await supabase
      .from("product_scores")
      .upsert(scores, { onConflict: "cleaned_product_id", ignoreDuplicates: false });
    if (error) throw new Error(`Product Scores save failed: ${error.message}`);
  }
}
