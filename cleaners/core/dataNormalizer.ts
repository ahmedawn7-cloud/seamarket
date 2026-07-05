export function normalizePlatform(platform: string | undefined | null): string {
  if (!platform) return "Unknown";
  const p = platform.toLowerCase();
  if (p.includes("shopee")) return "Shopee";
  if (p.includes("lazada")) return "Lazada";
  if (p.includes("tiktok")) return "TikTok Shop";
  return platform;
}

export function cleanPrice(price: string | number | null | undefined): number | null {
  if (price === null || price === undefined) return null;
  if (typeof price === "number") return price;
  
  let pStr = price.toString().toUpperCase().replace("RM", "").replace("MYR", "").replace(/,/g, "").trim();
  // If it's a range like "10.00 - 20.00", take the lower bound
  if (pStr.includes("-")) {
    pStr = pStr.split("-")[0].trim();
  }
  
  const parsed = parseFloat(pStr);
  return isNaN(parsed) ? null : parsed;
}

export function cleanSales(sales: string | number | null | undefined): number | null {
  if (sales === null || sales === undefined) return null;
  if (typeof sales === "number") return sales;

  let sStr = sales.toString().toLowerCase().trim();
  sStr = sStr.replace(/sold/g, "").replace(/items/g, "").replace(/\+/g, "").trim();
  
  let multiplier = 1;
  if (sStr.includes("k")) {
    multiplier = 1000;
    sStr = sStr.replace("k", "");
  } else if (sStr.includes("m")) {
    multiplier = 1000000;
    sStr = sStr.replace("m", "");
  }

  const parsed = parseFloat(sStr);
  return isNaN(parsed) ? null : Math.floor(parsed * multiplier);
}

const CATEGORY_MAP: Record<string, string[]> = {
  "Beauty": ["beauty", "personal care", "cosmetics", "skincare", "makeup"],
  "Home": ["home", "living", "lifestyle", "furniture", "decor"],
  "Kitchen": ["kitchen", "dining", "cookware"],
  "Electronics": ["electronics", "gadget", "accessories", "phone", "computer", "audio"],
  "Fashion": ["fashion", "women", "men", "apparel", "clothing", "shoes", "bags", "watches"],
  "Baby": ["baby", "kids", "mother", "maternity", "toys"],
  "Health": ["health", "wellness", "supplement", "medical"],
  "Fitness": ["fitness", "sports", "outdoor", "gym", "exercise"],
  "Automotive": ["automotive", "motors", "car", "motorcycle"],
  "Pet": ["pet", "cat", "dog", "aquarium"],
  "Office": ["office", "stationery", "school"]
};

export function standardizeCategory(rawCategory: string | null | undefined): string {
  if (!rawCategory) return "Others";
  
  const raw = rawCategory.toLowerCase();
  
  for (const [cleanCat, keywords] of Object.entries(CATEGORY_MAP)) {
    for (const kw of keywords) {
      if (raw.includes(kw)) {
        return cleanCat;
      }
    }
  }
  
  return "Others";
}

export function ruleBasedCleanName(name: string | null | undefined): string {
  if (!name) return "Unknown Product";
  
  let clean = name.replace(/[^\w\s\-\.,&]/gi, " "); // Remove emojis and strange symbols
  
  // Remove spam phrases
  const spamPhrases = ["readystock", "ready stock", "murah", "freeshipping", "free shipping", "100% original", "borong", "wholesale", "viral", "trending"];
  for (const phrase of spamPhrases) {
    const regex = new RegExp(`\\b${phrase}\\b`, "gi");
    clean = clean.replace(regex, "");
  }

  // Remove multiple spaces
  clean = clean.replace(/\s+/g, " ").trim();
  
  return clean || "Unknown Product";
}
