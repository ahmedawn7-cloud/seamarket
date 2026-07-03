const NOISE_WORDS = [
  "hot sale", "murah gila", "murah", "ready stock", "free shipping",
  "best seller", "bestseller", "limited offer", "promo", "viral",
  "trending", "buy now", "100% original", "original", "cod",
  "cash on delivery", "fast delivery", "local seller"
];

export function cleanProductName(name: string): string {
  if (!name) return "Unknown Product";

  let clean = name.toLowerCase();

  // Remove emojis and non-alphanumeric/spaces/basic punctuation
  clean = clean.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  
  // Remove noise words
  for (const word of NOISE_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    clean = clean.replace(regex, "");
  }

  // Remove excessive punctuation
  clean = clean.replace(/[\[\]{}()【】*#~_]/g, " ");
  
  // Remove repeated spaces
  clean = clean.replace(/\s+/g, " ").trim();

  // Capitalize first letter of each word for normalized view
  clean = clean.split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return clean || "Unknown Product";
}
