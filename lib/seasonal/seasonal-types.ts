export type EventScope = "Malaysia" | "Global" | "Shopping";

export type TimingStatus =
  | "Too early"
  | "Research now"
  | "Source now"
  | "Launch now"
  | "Peak demand"
  | "Too late";

export interface SeasonalEvent {
  id: string;
  name: string;
  scope: EventScope;
  month: number; // 1-12
  approximateDate: string; // e.g. "Mid-February" or "Nov 11"
  description: string;
  defaultCategories: string[]; // Static fallback categories
}

export interface AIScoreDetails {
  opportunityScore: number; // 0-100
  competitionRisk: number; // 0-100
  supplierReadiness: number; // 0-100
  timingReadiness: number; // 0-100
  campaignImpact: number; // 0-100
  confidence: number; // 0-100
}

export interface CategoryOpportunity {
  eventId: string;
  category: string;
  timingStatus: TimingStatus;
  score: AIScoreDetails;
  explanation: string;
  productIdeas: string[];
  isAiGenerated: boolean;
}

export interface SeasonalPredictionRow {
  id: string;
  year: number;
  event_id: string;
  category: string;
  model_used: string;
  prediction_json: {
    timingStatus: TimingStatus;
    score: AIScoreDetails;
    explanation: string;
    productIdeas: string[];
  };
  valid_until: string;
  created_at: string;
  updated_at: string;
}
