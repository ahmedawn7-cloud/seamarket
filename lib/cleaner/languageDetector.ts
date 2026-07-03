export function detectLanguage(text: string): string {
  if (!text) return "unknown";

  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  
  // Basic Malay heuristics
  const malayKeywords = ["untuk", "yang", "dan", "dengan", "murah", "baru", "warna", "cantik", "baju", "seluar"];
  const lowerText = text.toLowerCase();
  
  let hasMalay = false;
  for (const mw of malayKeywords) {
    if (lowerText.includes(mw)) {
      hasMalay = true;
      break;
    }
  }

  // Basic English heuristics (if not obvious Malay or Chinese)
  const englishKeywords = ["for", "with", "and", "the", "new", "color", "beautiful", "shirt", "pants"];
  let hasEnglish = false;
  for (const ew of englishKeywords) {
    if (lowerText.includes(` ${ew} `)) {
      hasEnglish = true;
      break;
    }
  }

  if (hasChinese && (hasMalay || hasEnglish)) return "mixed";
  if (hasChinese) return "chinese";
  if (hasMalay && hasEnglish) return "mixed";
  if (hasMalay) return "malay";
  if (hasEnglish) return "english";

  // Default to unknown if no strong signals
  return "unknown";
}
