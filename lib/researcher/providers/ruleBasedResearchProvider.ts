import { ProductResearch, SupplierResearch, RegulatoryResearch } from "../types";
import { calculateResearchConfidence } from "../researchConfidence";
import { buildSource } from "../sourceBuilder";

export function runRuleBasedResearch(cleanedProduct: any) {
  // Infer base confidence from cleaned product's score
  const baseConfidence = cleanedProduct.confidence_score || 50;
  
  // 1. Generate Product Research
  const productResearch: Partial<ProductResearch> = {
    cleaned_product_id: cleanedProduct.id,
    internal_product_id: cleanedProduct.internal_product_id,
    research_status: 'completed',
    research_confidence: calculateResearchConfidence(baseConfidence),
    product_summary: generateSummary(cleanedProduct),
    target_customer: inferTargetCustomer(cleanedProduct.normalized_category),
    demand_signals: ["Consistent search volume implied by presence", "Broad category appeal"],
    competition_signals: ["High competition likely due to open marketplace listing"],
    product_risks: inferProductRisks(cleanedProduct.normalized_category),
    shipping_risks: inferShippingRisks(cleanedProduct.normalized_category),
    launch_difficulty: inferLaunchDifficulty(cleanedProduct.normalized_category),
    marketing_angles: inferMarketingAngles(cleanedProduct.normalized_category),
    suggested_keywords: [
      ...cleanedProduct.keywords, 
      "malaysia", 
      cleanedProduct.normalized_category.toLowerCase().split(" ")[0]
    ].slice(0, 8),
    suggested_titles: {
      "shopee": `${cleanedProduct.clean_name_ai} [Ready Stock MY]`,
      "lazada": `${cleanedProduct.clean_name_ai} | Fast Delivery`,
      "tiktok": `Viral ${cleanedProduct.clean_name_ai}`
    },
    suggested_listing_bullets: [
      `Premium quality ${cleanedProduct.normalized_category.toLowerCase()}`,
      "Fast shipping from local warehouse",
      "100% satisfaction guarantee",
      `Perfect for ${inferTargetCustomer(cleanedProduct.normalized_category)}`
    ],
    regulatory_notes: ["Review official regulatory guidelines before importing."],
    research_sources: [buildSource("ruleBasedResearchProvider", "product_intelligence")]
  };

  // 2. Generate Supplier Research Placeholders
  const localSupplier: Partial<SupplierResearch> = {
    cleaned_product_id: cleanedProduct.id,
    internal_product_id: cleanedProduct.internal_product_id,
    supplier_type: "local_possible",
    supplier_name: null,
    supplier_url: null,
    supplier_country: "Malaysia",
    supplier_shipping_location: null,
    estimated_cogs_rm: null,
    estimated_moq: 10,
    estimated_lead_time_days: 3,
    supplier_confidence: "low",
    supplier_notes: "Likely available from local wholesale or dropship suppliers. Manual supplier validation required.",
    source: "ruleBasedResearchProvider",
    raw_payload: null
  };

  const intlSupplier: Partial<SupplierResearch> = {
    cleaned_product_id: cleanedProduct.id,
    internal_product_id: cleanedProduct.internal_product_id,
    supplier_type: "international_possible",
    supplier_name: null,
    supplier_url: null,
    supplier_country: "China",
    supplier_shipping_location: null,
    estimated_cogs_rm: null,
    estimated_moq: 100,
    estimated_lead_time_days: 14,
    supplier_confidence: "low",
    supplier_notes: "Likely international sourcing required. Check MOQ, shipping weight, and import risk.",
    source: "ruleBasedResearchProvider",
    raw_payload: null
  };

  // 3. Generate Regulatory Research
  const regulatoryResearch: Partial<RegulatoryResearch> = {
    cleaned_product_id: cleanedProduct.id,
    internal_product_id: cleanedProduct.internal_product_id,
    country: "Malaysia",
    category: cleanedProduct.normalized_category,
    possible_regulatory_flags: inferRegulatoryFlags(cleanedProduct.normalized_category),
    sirim_risk: inferSirimRisk(cleanedProduct.normalized_category),
    kkm_risk: inferKkmRisk(cleanedProduct.normalized_category),
    npra_risk: inferNpraRisk(cleanedProduct.normalized_category),
    customs_risk: "medium", // Default baseline
    age_restriction_risk: "low",
    restricted_product_risk: inferRestrictedRisk(cleanedProduct.normalized_category),
    compliance_notes: [
      "This is a preliminary risk flag, not legal advice. Verify with official Malaysian authorities before selling."
    ],
    official_sources: [buildSource("ruleBasedResearchProvider", "regulatory_intelligence")],
    regulatory_confidence: calculateResearchConfidence(baseConfidence)
  };

  return { productResearch, suppliers: [localSupplier, intlSupplier], regulatoryResearch };
}

// Helpers

function generateSummary(product: any): string {
  return `A ${product.normalized_category.toLowerCase()} product identified as ${product.clean_name_ai}. Brand is ${product.normalized_brand || "unspecified"}. Language detected: ${product.language}.`;
}

function inferTargetCustomer(category: string): string {
  if (category === "Baby & Kids") return "Parents and families";
  if (category === "Beauty & Personal Care") return "Individuals seeking cosmetics or skincare";
  if (category === "Pet Supplies") return "Pet owners";
  if (category === "Sports & Fitness") return "Active individuals and fitness enthusiasts";
  if (category === "Muslim Lifestyle") return "Muslim consumers in Malaysia";
  return "General adult consumers";
}

function inferProductRisks(category: string): string[] {
  if (category === "Electronics") return ["High defect rate possible", "Warranty claims"];
  if (category === "Beauty & Personal Care") return ["Allergic reactions", "Ingredient claims / approval risk"];
  if (category === "Baby & Kids") return ["High safety risk", "Choking hazards"];
  if (category === "Health & Wellness") return ["Health claims liability"];
  return ["Standard return risk"];
}

function inferShippingRisks(category: string): string[] {
  if (category === "Electronics" || category === "Home & Living") return ["Damage in transit", "High volumetric weight"];
  if (category === "Beauty & Personal Care" || category === "Health & Wellness") return ["Temperature sensitivity", "Liquid leakage"];
  return ["Standard shipping risk"];
}

function inferLaunchDifficulty(category: string): "low" | "medium" | "high" {
  if (["Electronics", "Health & Wellness", "Baby & Kids", "Beauty & Personal Care"].includes(category)) return "high";
  if (["Fashion", "Home & Living", "Mobile Accessories"].includes(category)) return "medium";
  return "low";
}

function inferMarketingAngles(category: string): string[] {
  if (category === "Electronics") return ["Tech upgrade", "Productivity boost"];
  if (category === "Beauty & Personal Care") return ["Self-care", "Confidence boost"];
  if (category === "Home & Living") return ["Aesthetic upgrade", "Organization"];
  return ["Problem solver", "Value for money"];
}

function inferRegulatoryFlags(category: string): string[] {
  const flags = [];
  if (category === "Electronics" || category === "Car Accessories") flags.push("Possible SIRIM Certification Required");
  if (category === "Beauty & Personal Care") flags.push("Possible NPRA Notification Required");
  if (category === "Health & Wellness") flags.push("Possible KKM MAL/NOT Registration Required");
  if (category === "Baby & Kids" || category === "Toys & Games") flags.push("MC Mark (Malaysian Conformity) Possible");
  return flags;
}

function inferSirimRisk(category: string): "low" | "medium" | "high" {
  if (["Electronics", "Mobile Accessories"].includes(category)) return "high";
  if (category === "Car Accessories") return "medium";
  return "low";
}

function inferKkmRisk(category: string): "low" | "medium" | "high" {
  if (["Health & Wellness"].includes(category)) return "high";
  if (["Beauty & Personal Care"].includes(category)) return "medium";
  return "low";
}

function inferNpraRisk(category: string): "low" | "medium" | "high" {
  if (["Beauty & Personal Care"].includes(category)) return "high";
  return "low";
}

function inferRestrictedRisk(category: string): "low" | "medium" | "high" {
  if (["Health & Wellness"].includes(category)) return "high";
  return "low";
}
