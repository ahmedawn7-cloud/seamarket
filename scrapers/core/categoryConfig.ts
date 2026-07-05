export interface CategoryAllocation {
  category: string;
  targetCount: number;
}

export interface PlatformConfig {
  platform: string;
  maxProductsPerPlatform: number;
  maxCandidatesPerPlatform: number;
  perPlatformTimeout: number; // in milliseconds
  categories: CategoryAllocation[];
  keywords: string[];
  seedUrls: string[];
}
