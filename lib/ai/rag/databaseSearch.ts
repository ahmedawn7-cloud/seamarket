import { getServiceSupabaseClient } from "@/lib/supabase/serviceRoleClient";
import { DetectedIntent } from "./intentDetector";

export interface SearchResult {
  data: any[];
  tables_used: string[];
}

export async function executeDatabaseSearch(question: string, intent: DetectedIntent, explicitProductIds?: string[]): Promise<SearchResult> {
  const supabase = getServiceSupabaseClient();

  try {
    // If specific products are provided (e.g. from ProductDrawer action)
    if (explicitProductIds && explicitProductIds.length > 0) {
      const { data, error } = await supabase
        .from("cleaned_products")
        .select(`
          *,
          scraped_products (*),
          product_research (*),
          supplier_research (*),
          regulatory_research (*),
          product_scores (*)
        `)
        .in("id", explicitProductIds);

      if (error) throw error;

      return {
        data: data || [],
        tables_used: ["cleaned_products", "product_scores", "product_research", "supplier_research", "regulatory_research"]
      };
    }

    if (intent === "opportunity_question" || intent === "product_search") {
      const { data, error } = await supabase
        .from("product_scores")
        .select(`
          *,
          cleaned_products ( clean_name_ai, normalized_category, price_rm ),
          product_research ( business_summary, target_customer )
        `)
        .eq("final_recommendation", "source_now")
        .order("ai_score", { ascending: false })
        .limit(5);

      if (error) throw error;

      return {
        data: data || [],
        tables_used: ["product_scores", "cleaned_products", "product_research"]
      };
    }

    if (intent === "supplier_search" || intent === "supplier_compare") {
      const { data, error } = await supabase
        .from("supplier_research")
        .select(`
          *,
          cleaned_products ( clean_name_ai )
        `)
        .eq("supplier_type", "local_possible")
        .order("estimated_lead_time_days", { ascending: true })
        .limit(5);

      if (error) throw error;

      return {
        data: data || [],
        tables_used: ["supplier_research", "cleaned_products"]
      };
    }

    if (intent === "regulation_question" || intent === "risk_question") {
      const { data, error } = await supabase
        .from("product_scores")
        .select(`
          *,
          cleaned_products ( clean_name_ai ),
          regulatory_research (*)
        `)
        .gte("risk_score", 70)
        .limit(5);

      if (error) throw error;

      return {
        data: data || [],
        tables_used: ["product_scores", "regulatory_research", "cleaned_products"]
      };
    }

    const { data, error } = await supabase
      .from("cleaned_products")
      .select(`*, product_scores(ai_score, final_recommendation)`)
      .limit(3);

    if (error) throw error;

    return {
      data: data || [],
      tables_used: ["cleaned_products", "product_scores"]
    };
  } catch (error) {
    console.warn("Pasar AI advanced database search unavailable, falling back to MYProductScout_Master:", error);
    return searchMasterTableFallback(supabase, question, explicitProductIds);
  }
}

async function searchMasterTableFallback(supabase: ReturnType<typeof getServiceSupabaseClient>, question: string, explicitProductIds?: string[]) {
  let query = supabase
    .from("MYProductScout_Master")
    .select(`
      Product_Name,
      Clean_Name_AI,
      Category,
      Price_RM,
      Final_Price_Low,
      Sales,
      Review_Count,
      Rating_Score,
      Product_URL,
      Image_URL,
      Shipping_Location,
      Trend_Rank,
      Internal_Rank
    `)
    .limit(6);

  const firstId = explicitProductIds?.[0];
  if (firstId) {
    query = query.or(`Product_URL.eq.${firstId},Product_Name.eq.${firstId}`);
  } else {
    const queryText = question.trim();
    if (queryText.length >= 3) {
      query = query.or(`Product_Name.ilike.%${queryText}%,Clean_Name_AI.ilike.%${queryText}%,Category.ilike.%${queryText}%`);
    }
  }

  const { data } = await query;
  return {
    data: data || [],
    tables_used: ["MYProductScout_Master"],
  };
}
