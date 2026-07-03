const STOP_WORDS = new Set([
  "and", "the", "with", "for", "in", "of", "a", "an", "is", "to", "on", 
  "at", "by", "or", "from", "cm", "mm", "kg", "g", "ml", "l"
]);

export function extractKeywords(cleanName: string): string[] {
  if (!cleanName) return [];
  
  const words = cleanName.toLowerCase().split(/\s+/);
  const keywords = new Set<string>();

  for (const word of words) {
    const cleanWord = word.replace(/[^a-z0-9]/g, "");
    if (cleanWord.length > 1 && !STOP_WORDS.has(cleanWord)) {
      keywords.add(cleanWord);
    }
  }

  return Array.from(keywords);
}
