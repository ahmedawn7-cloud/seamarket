export const CONTRIBUTION_OWNER_EMAIL = "ahmedawn7@gmail.com";

export const CONTRIBUTION_STATUSES = [
  "pending_review",
  "approved",
  "rejected",
  "duplicate",
  "needs_info",
  "featured",
  "sent_to_product_ops",
  "archived",
] as const;

export type ContributionStatus = (typeof CONTRIBUTION_STATUSES)[number];

export type ReviewAction =
  | "approve"
  | "reject"
  | "duplicate"
  | "needs_info"
  | "feature"
  | "send_to_product_ops"
  | "archive";

export type ContributorProfile = {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_points: number;
  submitted_count: number;
  approved_count: number;
  rejected_count: number;
  duplicate_count: number;
  needs_info_count: number;
  featured_count: number;
  sent_to_product_ops_count: number;
  current_rank: string;
  badges: string[];
};

export type ProductRecommendation = {
  id: string;
  user_id: string;
  contributor_profile_id: string | null;
  product_name: string;
  platform_found_on: string;
  product_url: string | null;
  image_url: string | null;
  category: string | null;
  price_rm: number | null;
  approximate_sales: number | null;
  why_trending: string;
  source_keyword: string | null;
  notes: string | null;
  status: ContributionStatus;
  admin_feedback: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  points_awarded: number;
  duplicate_of: string | null;
  featured: boolean;
  sent_to_product_ops: boolean;
  product_intake_id: string | null;
  created_at: string;
  updated_at: string;
};

export function getContributorRank(approvedCount: number) {
  if (approvedCount >= 100) return "Elite Contributor";
  if (approvedCount >= 50) return "Intelligence Partner";
  if (approvedCount >= 25) return "Product Hunter";
  if (approvedCount >= 10) return "Trend Finder";
  if (approvedCount >= 3) return "Market Scout";
  return "New Scout";
}

export function getContributorBadges(profile: Partial<ContributorProfile>) {
  const badges: string[] = [];
  if ((profile.submitted_count ?? 0) >= 1) badges.push("First Signal");
  if ((profile.approved_count ?? 0) >= 3) badges.push("Verified Scout");
  if ((profile.featured_count ?? 0) >= 1) badges.push("Featured Contributor");
  if ((profile.sent_to_product_ops_count ?? 0) >= 1) badges.push("Product Ops Source");
  if ((profile.total_points ?? 0) >= 100) badges.push("High Trust");
  return badges;
}

export function getPointsForActivity(action: string) {
  if (action === "recommendation_submitted") return 1;
  if (action === "recommendation_approved") return 10;
  if (action === "recommendation_featured") return 25;
  if (action === "recommendation_sent_to_product_ops") return 15;
  if (action === "recommendation_marked_duplicate") return 0;
  if (action === "recommendation_rejected") return 0;
  if (action === "recommendation_needs_info") return 0;
  if (action === "recommendation_archived") return 0;
  return 0;
}

export function getStatusForReviewAction(action: ReviewAction): ContributionStatus {
  if (action === "approve") return "approved";
  if (action === "reject") return "rejected";
  if (action === "duplicate") return "duplicate";
  if (action === "needs_info") return "needs_info";
  if (action === "feature") return "featured";
  if (action === "send_to_product_ops") return "sent_to_product_ops";
  return "archived";
}

export function getActivityForReviewAction(action: ReviewAction) {
  if (action === "approve") return "recommendation_approved";
  if (action === "reject") return "recommendation_rejected";
  if (action === "duplicate") return "recommendation_marked_duplicate";
  if (action === "needs_info") return "recommendation_needs_info";
  if (action === "feature") return "recommendation_featured";
  if (action === "send_to_product_ops") return "recommendation_sent_to_product_ops";
  return "recommendation_archived";
}

export function formatContributionStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
