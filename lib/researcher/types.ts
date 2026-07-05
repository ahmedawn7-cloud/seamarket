export interface ProductResearch {
  cleaned_product_id: string;
  internal_product_id: string;
  research_status: string;
  research_confidence: "low" | "medium" | "high";
  product_summary: string | null;
  target_customer: string | null;
  demand_signals: string[];
  competition_signals: string[];
  product_risks: string[];
  shipping_risks: string[];
  launch_difficulty: "low" | "medium" | "high" | "unknown";
  marketing_angles: string[];
  suggested_keywords: string[];
  suggested_titles: Record<string, string> | null;
  suggested_listing_bullets: string[];
  regulatory_notes: string[];
  research_sources: any;
}

export interface SupplierResearch {
  cleaned_product_id: string;
  internal_product_id: string;
  supplier_type: string;
  supplier_name: string | null;
  supplier_url: string | null;
  supplier_country: string | null;
  supplier_shipping_location: string | null;
  estimated_cogs_rm: number | null;
  estimated_moq: number | null;
  estimated_lead_time_days: number | null;
  supplier_confidence: "low" | "medium" | "high";
  supplier_notes: string | null;
  source: string;
  raw_payload: any;
}

export interface RegulatoryResearch {
  cleaned_product_id: string;
  internal_product_id: string;
  country: string;
  category: string;
  possible_regulatory_flags: string[];
  sirim_risk: "low" | "medium" | "high" | "unknown";
  kkm_risk: "low" | "medium" | "high" | "unknown";
  npra_risk: "low" | "medium" | "high" | "unknown";
  customs_risk: "low" | "medium" | "high" | "unknown";
  age_restriction_risk: "low" | "medium" | "high" | "unknown";
  restricted_product_risk: "low" | "medium" | "high" | "unknown";
  compliance_notes: string[];
  official_sources: any;
  regulatory_confidence: "low" | "medium" | "high";
}
