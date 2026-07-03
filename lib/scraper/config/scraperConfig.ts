export const scraperConfig = {
  defaultLimit: parseInt(process.env.SCRAPER_MAX_PRODUCTS || "100", 10),
  supportedPlatforms: ["Shopee", "Lazada", "TikTok Shop"],
  defaultPlatform: process.env.SCRAPER_DEFAULT_PLATFORM || "Shopee",
  secret: process.env.SCRAPER_SECRET || "default_dev_secret",
};

export function validateEnvironment() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in environment variables");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in environment variables");
  }
}
