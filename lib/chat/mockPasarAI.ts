import type { PasarAIAction, PasarAIResponse } from "@/types/chat";

const DISCLAIMER = "AI insights are estimates only. Please verify before making business decisions.";

export async function mockPasarAI(message: string): Promise<PasarAIResponse> {
  const text = message.toLowerCase();
  const actions = detectTrackingActions(message);
  let content = getDefaultResponse();

  if (containsAny(text, ["sirim", "kkm", "npra", "approval", "permit", "regulated"])) {
    content =
      "For Malaysia, regulated products need extra care. Electrical and electronic items may require SIRIM certification. Cosmetics, supplements, medicines, and health-related products may require KKM or NPRA checks. Avoid launching these categories until you verify the latest official requirements, supplier documentation, and marketplace listing rules.";
  } else if (containsAny(text, ["profit", "margin", "roi", "calculate", "fee"])) {
    content =
      "Use this simple seller margin formula: Selling Price - Product Cost - Shipping - Platform Fee - Ads Cost - Packaging = Estimated Profit. For Shopee or TikTok Shop, also model vouchers, affiliate fees, returns, COD risk, and free-shipping subsidies before deciding the real margin.";
  } else if (containsAny(text, ["supplier", "local supplier", "source", "sourcing", "cj", "1688", "aliexpress"])) {
    content =
      "For supplier checks, compare local availability first when speed matters. Prioritize suppliers with stable stock, clear product photos, repeatable packaging, reasonable MOQ, and return support. If overseas sourcing is needed, validate weight, dimensions, shipping time, and whether the product has Malaysia compliance risk.";
  } else if (containsAny(text, ["risk", "avoid", "danger", "bad product"])) {
    content =
      "This week, avoid products with high defect risk, unclear claims, fragile shipping, regulated health or electrical claims, saturated ads, and very low review quality. Low-risk products usually have simple fulfillment, clear demand, lightweight shipping, low return probability, and no approval uncertainty.";
  } else if (containsAny(text, ["tiktok", "video", "viral", "hook"])) {
    content =
      "For TikTok Shop, look for products that are demonstrable in under 8 seconds: visible before-after, satisfying transformation, strong problem-solution hook, and easy bundle logic. The product should be explainable without heavy education.";
  } else if (containsAny(text, ["shopee"])) {
    content =
      "For Shopee, check sales velocity, review depth, price ladder, voucher behavior, shipping location, and whether the same product has many copycat listings. A good Shopee product needs enough demand but still room to differentiate with bundles, content, or local fulfillment.";
  } else if (containsAny(text, ["lazada"])) {
    content =
      "For Lazada, compare marketplace depth and seller maturity. Products with weaker Lazada competition but strong Shopee or TikTok demand can be worth testing, especially when fulfillment and category compliance are clean.";
  } else if (containsAny(text, ["title", "listing", "product title", "generate"])) {
    content =
      "A strong TikTok Shop title should include the product type, main use case, key benefit, and buyer keyword. Example: Portable Mini Blender for Smoothies, USB Rechargeable Juice Cup for Travel, Office and Gym.";
  } else if (containsAny(text, ["product", "worth selling", "recommend", "find me", "low-risk"])) {
    content =
      "A product is worth shortlisting when demand is visible, reviews prove buyer acceptance, margins survive ads and fees, supply is stable, and compliance risk is low. For Malaysia, I would prioritize lightweight home tools, modest fashion accessories, beauty tools without medical claims, and simple pet or lifestyle accessories.";
  }

  return {
    content: `${content}\n\n${DISCLAIMER}`,
    actions,
  };
}

function containsAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function detectTrackingActions(message: string): PasarAIAction[] {
  const text = message.toLowerCase();
  const actions: PasarAIAction[] = [];
  const trackMatch = message.match(/(?:track|monitor|save)\s+(?:this\s+)?(?:product|item)\s+(.+)/i);
  const categoryMatch = message.match(/(?:track|monitor|save)\s+(?:the\s+)?(?:category|niche)\s+(.+)/i);

  if (trackMatch?.[1]) {
    actions.push({
      type: "track_product",
      label: `Track product: ${cleanActionValue(trackMatch[1])}`,
      value: cleanActionValue(trackMatch[1]),
    });
  }

  if (categoryMatch?.[1]) {
    actions.push({
      type: "track_category",
      label: `Track category: ${cleanActionValue(categoryMatch[1])}`,
      value: cleanActionValue(categoryMatch[1]),
    });
  }

  if (actions.length === 0 && containsAny(text, ["petshop", "pet shop", "pet products"])) {
    actions.push({ type: "track_category", label: "Track category: Pet products", value: "Pet products" });
  }

  return actions;
}

function cleanActionValue(value: string) {
  return value
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function getDefaultResponse() {
  return "I can help you validate product ideas, estimate margins, identify Malaysia compliance risks, compare suppliers, improve marketplace listings, and decide what to track next. Tell me the product, category, marketplace, selling price, cost, or supplier concern you want to examine.";
}
