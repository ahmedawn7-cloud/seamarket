export function normalizeCategory(rawCategory: string | null): string {
  if (!rawCategory) return "Other";
  
  const lower = rawCategory.toLowerCase();
  
  if (lower.includes("beauty") || lower.includes("makeup") || lower.includes("skincare")) return "Beauty & Personal Care";
  if (lower.includes("home") || lower.includes("living") || lower.includes("furniture")) return "Home & Living";
  if (lower.includes("kitchen") || lower.includes("dining") || lower.includes("cookware")) return "Kitchen & Dining";
  if (lower.includes("mobile") || lower.includes("phone") || lower.includes("cable") || lower.includes("case")) return "Mobile Accessories";
  if (lower.includes("electronic") || lower.includes("computer") || lower.includes("appliance")) return "Electronics";
  if (lower.includes("fashion") || lower.includes("clothing") || lower.includes("shoes") || lower.includes("apparel")) return "Fashion";
  if (lower.includes("baby") || lower.includes("kids") || lower.includes("toy")) return "Baby & Kids";
  if (lower.includes("pet")) return "Pet Supplies";
  if (lower.includes("car") || lower.includes("auto") || lower.includes("vehicle")) return "Car Accessories";
  if (lower.includes("health") || lower.includes("medical") || lower.includes("supplement")) return "Health & Wellness";
  if (lower.includes("sport") || lower.includes("fitness") || lower.includes("gym")) return "Sports & Fitness";
  if (lower.includes("game") || lower.includes("console")) return "Toys & Games";
  if (lower.includes("office") || lower.includes("stationery") || lower.includes("pen")) return "Office & Stationery";
  if (lower.includes("muslim") || lower.includes("hijab") || lower.includes("halal") || lower.includes("telekung")) return "Muslim Lifestyle";

  return "Other";
}
