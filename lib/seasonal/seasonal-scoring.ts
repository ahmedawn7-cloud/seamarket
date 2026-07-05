import { TimingStatus, AIScoreDetails, SeasonalEvent } from "./seasonal-types";

/**
 * Calculates a basic, explainable static score for a category and event.
 * Used as a fallback if the AI model fails or to supplement initial data.
 * 
 * Formula:
 * - Event Demand Weight (30%) - based on scope (Shopping > Malaysia > Global)
 * - Category Relevance (25%) - always 25% for static fallback if it's in the default list
 * - Timing Readiness (20%) - based on months away
 * - Marketplace Campaign Impact (15%) - based on if it's a shopping event
 * - Competition Risk Adjustment (10%) - base 10%
 */
export function calculateStaticSeasonalScore(
  event: SeasonalEvent,
  currentMonth: number
): { score: AIScoreDetails; timingStatus: TimingStatus; explanation: string } {
  let monthsAway = event.month - currentMonth;
  if (monthsAway < 0) {
    monthsAway += 12; // Next year's event
  }

  // 1. Timing Readiness & Status
  let timingReadiness = 0;
  let timingStatus: TimingStatus = "Too early";

  if (monthsAway >= 4) {
    timingStatus = "Too early";
    timingReadiness = 40;
  } else if (monthsAway === 3) {
    timingStatus = "Research now";
    timingReadiness = 100; // Perfect time to research
  } else if (monthsAway === 2) {
    timingStatus = "Source now";
    timingReadiness = 80;
  } else if (monthsAway === 1) {
    timingStatus = "Launch now";
    timingReadiness = 60;
  } else if (monthsAway === 0) {
    timingStatus = "Peak demand";
    timingReadiness = 40; // Too late to source, but good to ride the wave if already launched
  }

  // 2. Event Demand Weight
  let eventDemandWeight = 60; // Global
  if (event.scope === "Malaysia") eventDemandWeight = 80;
  if (event.scope === "Shopping") eventDemandWeight = 100;

  // 3. Campaign Impact
  const campaignImpact = event.scope === "Shopping" ? 100 : event.scope === "Malaysia" ? 70 : 40;

  // Final static calculations
  const competitionRisk = 50; // Neutral static risk
  const supplierReadiness = timingStatus === "Source now" ? 90 : 60;
  
  // Weighted calculation (max 100)
  const opportunityScore = Math.round(
    (eventDemandWeight * 0.3) +
    (100 * 0.25) + // Assume category is relevant
    (timingReadiness * 0.2) +
    (campaignImpact * 0.15) +
    (50 * 0.1) // 100 - competition risk
  );

  let explanation = `The ${event.name} season is approaching in ${monthsAway === 0 ? 'this month' : monthsAway + ' month(s)'}. `;
  if (timingStatus === "Research now") explanation += "Now is the perfect time to evaluate product-market fit.";
  else if (timingStatus === "Source now") explanation += "You should be locking in suppliers immediately.";
  else if (timingStatus === "Launch now") explanation += "Listings should go live to catch early traffic.";
  else if (timingStatus === "Peak demand") explanation += "Demand is peaking; focus on ads and conversion optimization.";
  else explanation += "It is currently too early to commit capital, but keep an eye on trends.";

  return {
    timingStatus,
    explanation,
    score: {
      opportunityScore,
      competitionRisk,
      supplierReadiness,
      timingReadiness,
      campaignImpact,
      confidence: 50, // Static fallback confidence is always 50%
    }
  };
}
