import { createClient } from "@supabase/supabase-js";

export const MASTER_TABLE = "MYProductScout_Master";
export const STAGING_TABLE = "scraped_products_staging";
export const RESEARCH_TABLE = "product_research_scores";

export const MASTER_COLUMNS = [
  "Scrape_Date",
  "Internal_Rank",
  "Rank",
  "Clean_Name_AI",
  "Product_Name",
  "Image_URL",
  "Product_URL",
  "Variant_Count",
  "Sales",
  "Price_RM",
  "Shipping_Location",
  "Stock_Level",
  "Rating_Score",
  "Review_Count",
  "Video_URL",
  "Discount_Percent",
  "Store_Name",
  "Category",
  "Brand",
  "Initial_Price_Low",
  "Final_Price_Low",
  "Supplier_Link",
  "COGS_RM",
  "Weight_kg",
  "Dimensions_cm",
  "Platform_Fee_Pct",
  "Shipping_Location_1",
  "Ad_Spend_Est_RM",
  "Affiliate_Link",
  "Revenue_Calc",
  "Net_Margin_Calc",
  "ROI_Calc",
  "Profit_Score",
  "Trend_Rank",
];

export function createOpsSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase URL or key.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function mapStagingToMaster(row: any, index: number) {
  return {
    Scrape_Date: row.scrape_date || row.Scrape_Date || new Date().toISOString().slice(0, 10),
    Internal_Rank: row.internal_rank ?? row.Internal_Rank ?? null,
    Rank: row.rank ?? row.Rank ?? row.trend_rank ?? index + 1,
    Clean_Name_AI: row.clean_name_ai || row.Clean_Name_AI || row.product_name || row.Product_Name || null,
    Product_Name: row.product_name || row.Product_Name || null,
    Image_URL: row.image_url || row.Image_URL || null,
    Product_URL: row.product_url || row.Product_URL || null,
    Variant_Count: numberOrNull(row.variant_count ?? row.Variant_Count),
    Sales: numberOrNull(row.sales ?? row.Sales),
    Price_RM: numberOrNull(row.price_rm ?? row.Price_RM),
    Shipping_Location: row.shipping_location || row.Shipping_Location || null,
    Stock_Level: row.stock_level || row.Stock_Level || null,
    Rating_Score: numberOrNull(row.rating_score ?? row.Rating_Score),
    Review_Count: numberOrNull(row.review_count ?? row.Review_Count),
    Video_URL: row.video_url || row.Video_URL || null,
    Discount_Percent: numberOrNull(row.discount_percent ?? row.Discount_Percent),
    Store_Name: row.store_name || row.Store_Name || null,
    Category: row.category || row.Category || null,
    Brand: row.brand || row.Brand || null,
    Initial_Price_Low: numberOrNull(row.initial_price_low ?? row.Initial_Price_Low),
    Final_Price_Low: numberOrNull(row.final_price_low ?? row.Final_Price_Low ?? row.price_rm),
    Supplier_Link: row.supplier_link || row.Supplier_Link || null,
    COGS_RM: numberOrNull(row.cogs_rm ?? row.COGS_RM),
    Weight_kg: numberOrNull(row.weight_kg ?? row.Weight_kg),
    Dimensions_cm: row.dimensions_cm || row.Dimensions_cm || null,
    Platform_Fee_Pct: numberOrNull(row.platform_fee_pct ?? row.Platform_Fee_Pct),
    Shipping_Location_1: row.shipping_location_1 || row.Shipping_Location_1 || row.shipping_location || null,
    Ad_Spend_Est_RM: numberOrNull(row.ad_spend_est_rm ?? row.Ad_Spend_Est_RM),
    Affiliate_Link: row.affiliate_link || row.Affiliate_Link || null,
    Revenue_Calc: numberOrNull(row.revenue_calc ?? row.Revenue_Calc),
    Net_Margin_Calc: numberOrNull(row.net_margin_calc ?? row.Net_Margin_Calc),
    ROI_Calc: numberOrNull(row.roi_calc ?? row.ROI_Calc),
    Profit_Score: numberOrNull(row.profit_score ?? row.Profit_Score),
    Trend_Rank: numberOrNull(row.trend_rank ?? row.Trend_Rank),
  };
}

function numberOrNull(value: any) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}
