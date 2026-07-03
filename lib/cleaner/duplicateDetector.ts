import crypto from "crypto";
import { CleanedProduct } from "./types";

export function generateDuplicateGroupHash(cleanName: string): string {
  // Use MD5 for simple deduplication hash based on normalized name
  const normalized = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "");
  return crypto.createHash("md5").update(normalized).digest("hex");
}

export function detectDuplicate(
  candidate: Partial<CleanedProduct>, 
  existingProducts: CleanedProduct[]
): { isDuplicate: boolean; duplicateGroup: string } {
  
  const candidateHash = candidate.duplicate_group || generateDuplicateGroupHash(candidate.clean_name_ai || "");
  
  // Very naive memory-based deduplication for the batch.
  // In a real scenario, this would query the DB. The engine will handle cross-batch later if needed.
  for (const existing of existingProducts) {
    if (existing.duplicate_group === candidateHash) {
      return { isDuplicate: true, duplicateGroup: candidateHash };
    }
    if (existing.product_url === candidate.product_url) {
      return { isDuplicate: true, duplicateGroup: existing.duplicate_group };
    }
  }

  return { isDuplicate: false, duplicateGroup: candidateHash };
}
