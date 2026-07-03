const BRAND_MAP: Record<string, string> = {
  "apple official store": "Apple",
  "apple": "Apple",
  "xiaomi official": "Xiaomi",
  "xiaomi": "Xiaomi",
  "samsung malaysia": "Samsung",
  "samsung": "Samsung",
  "no brand": "null",
  "oem": "OEM"
};

const KNOWN_BRANDS = ["Apple", "Xiaomi", "Samsung", "Sony", "LG", "Philips", "Dyson", "Huawei", "Oppo", "Vivo"];

export function normalizeBrand(rawBrand: string | null, productName: string): string | null {
  if (rawBrand) {
    const lowerRaw = rawBrand.toLowerCase().trim();
    if (BRAND_MAP[lowerRaw]) {
      const mapped = BRAND_MAP[lowerRaw];
      return mapped === "null" ? null : mapped;
    }
    // If it's a short valid string that isn't "No Brand", keep it
    if (lowerRaw !== "no brand" && lowerRaw.length > 1) {
      return rawBrand;
    }
  }

  // Infer from product name
  if (productName) {
    const lowerName = productName.toLowerCase();
    for (const kb of KNOWN_BRANDS) {
      if (lowerName.includes(kb.toLowerCase())) {
        return kb;
      }
    }
  }

  return null;
}
