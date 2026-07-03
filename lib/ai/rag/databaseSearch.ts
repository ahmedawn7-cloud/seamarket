import { createClient } from "@supabase/supabase-js";
import { DetectedIntent } from "./intentDetector";

export interface SearchResult {
  data: any[];
  tables_used: string[];
}

export async function executeDatabaseSearch(question: string, intent: DetectedIntent, explicitProductIds?: string[]): Promise<SearchResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // If specific products are provided (e.g. from ProductDrawer action)
  if (explicitProductIds && explicitProductIds.length > 0) {
    const { data } = await supabase
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
    
    return {
      data: data || [],
      tables_used: ["cleaned_products", "product_scores", "product_research", "supplier_research", "regulatory_research"]
    };
  }

  // Text-based broad search fallback for general queries
  // A real semantic search would use pgvector, but here we do a smart text match
  // or fetch top trending/opportunities depending on intent

  if (intent === "opportunity_question" || intent === "product_search") {
    // Fetch top 5 opportunities
    const { data } = await supabase
      .from("product_scores")
      .select(`
        *,
        cleaned_products ( clean_name_ai, normalized_category, price_rm ),
        product_research ( business_summary, target_customer )
      `)
      .eq("final_recommendation", "source_now")
      .order("ai_score", { ascending: false })
      .limit(5);

    return {
      data: data || [],
      tables_used: ["product_scores", "cleaned_products", "product_research"]
    };
  }

  if (intent === "supplier_search" || intent === "supplier_compare") {
    // Fetch top 5 products with strong local suppliers
    const { data } = await supabase
      .from("supplier_research")
      .select(`
        *,
        cleaned_products ( clean_name_ai )
      `)
      .eq("supplier_type", "local_possible")
      .order("estimated_lead_time_days", { ascending: true })
      .limit(5);

    return {
      data: data || [],
      tables_used: ["supplier_research", "cleaned_products"]
    };
  }

  if (intent === "regulation_question" || intent === "risk_question") {
    // Fetch top risky items as examples
    const { data } = await supabase
      .from("product_scores")
      .select(`
        *,
        cleaned_products ( clean_name_ai ),
        regulatory_research (*)
      `)
      .gte("risk_score", 70)
      .limit(5);

    return {
      data: data || [],
      tables_used: ["product_scores", "regulatory_research", "cleaned_products"]
    };
  }

  // Default: just fetch a couple of recent products as context
  const { data } = await supabase
    .from("cleaned_products")
    .select(`*, product_scores(ai_score, final_recommendation)`)
    .limit(3);

  return {
    data: data || [],
    tables_used: ["cleaned_products", "product_scores"]
  };
}
