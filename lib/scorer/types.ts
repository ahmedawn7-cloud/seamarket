export interface ProductScore {
  cleaned_product_id: string;
  scraped_product_id: string;
  internal_product_id: string;
  opportunity_score: number;
  profit_score: number;
  demand_score: number;
  competition_score: number;
  supplier_score: number;
  risk_score: number;
  regulatory_score: number;
  launch_difficulty_score: number;
  trend_score: number;
  ai_score: number;
  confidence_score: number;
  final_recommendation: "source_now" | "watch" | "research_more" | "avoid";
  scoring_notes: string[];
  score_breakdown: any;
}
