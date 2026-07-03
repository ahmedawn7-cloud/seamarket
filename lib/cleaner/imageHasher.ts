import crypto from "crypto";

export function generateImageHash(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  // TODO: Implement Perceptual Image Hashing (pHash) after downloading image buffer
  // For now, create a simple deterministic hash of the URL string itself
  return crypto.createHash("md5").update(imageUrl).digest("hex");
}
