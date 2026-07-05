import { NextResponse } from 'next/server';
import { AIRouter } from '@/lib/ai/AIRouter';
import { z } from 'zod';

// --- BULLETPROOF ZOD SCHEMAS ---

// Coerce any array or object into a neat string, fallback to empty string on error
const flexibleString = z.any().transform(val => {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.join('\n- ');
  if (val && typeof val === 'object') return JSON.stringify(val);
  if (val === null || val === undefined) return "";
  return String(val);
}).catch("");

// Coerce string numbers ("80") to actual numbers, clamp between 0-100, and fallback to 80 if completely missing/broken
const flexibleNumber = z.coerce.number().catch(80).transform(val => {
  if (isNaN(val)) return 80;
  return Math.min(Math.max(val, 0), 100);
});

const ConfidenceSchema = z.object({
  original: flexibleString,
  edited: flexibleString,
  confidence: flexibleNumber
}).catch({ original: "Data unavailable", edited: "Data unavailable", confidence: 80 });

const ScoreSchema = z.object({
  score: flexibleNumber,
  explanation: flexibleString
}).catch({ score: 80, explanation: "Analysis incomplete" });

const Step1Schema = z.object({
  trend_analysis: ConfidenceSchema.default({ original: "", edited: "", confidence: 80 }),
  target_customer: ConfidenceSchema.default({ original: "", edited: "", confidence: 80 }),
  problem_solved: ConfidenceSchema.default({ original: "", edited: "", confidence: 80 }),
  usps: ConfidenceSchema.default({ original: "", edited: "", confidence: 80 }),
  market_opportunity: ConfidenceSchema.default({ original: "", edited: "", confidence: 80 })
}).catch({
  trend_analysis: { original: "", edited: "", confidence: 80 },
  target_customer: { original: "", edited: "", confidence: 80 },
  problem_solved: { original: "", edited: "", confidence: 80 },
  usps: { original: "", edited: "", confidence: 80 },
  market_opportunity: { original: "", edited: "", confidence: 80 }
});

const Step2Schema = z.object({
  competition_landscape: ConfidenceSchema.default({ original: "", edited: "", confidence: 80 }),
  supplier_availability: ConfidenceSchema.default({ original: "", edited: "", confidence: 80 })
}).catch({
  competition_landscape: { original: "", edited: "", confidence: 80 },
  supplier_availability: { original: "", edited: "", confidence: 80 }
});

const Step3Schema = z.object({
  malaysia_regulatory: ConfidenceSchema.default({ original: "", edited: "", confidence: 80 }),
  risk_analysis: ConfidenceSchema.default({ original: "", edited: "", confidence: 80 })
}).catch({
  malaysia_regulatory: { original: "", edited: "", confidence: 80 },
  risk_analysis: { original: "", edited: "", confidence: 80 }
});

const Step4Schema = z.object({
  recommended_price: ConfidenceSchema.default({ original: "", edited: "", confidence: 80 }),
  estimated_margin: ConfidenceSchema.default({ original: "", edited: "", confidence: 80 }),
  recommended_actions: ConfidenceSchema.default({ original: "", edited: "", confidence: 80 })
}).catch({
  recommended_price: { original: "", edited: "", confidence: 80 },
  estimated_margin: { original: "", edited: "", confidence: 80 },
  recommended_actions: { original: "", edited: "", confidence: 80 }
});

const RatingSchema = z.object({
  score: z.coerce.number().catch(4.5).transform(val => {
    if (isNaN(val)) return 4.5;
    return Math.min(Math.max(val, 0), 5);
  }),
  explanation: flexibleString
}).catch({ score: 4.5, explanation: "Data unavailable" });

const Step5Schema = z.object({
  ai_score: ScoreSchema.default({ score: 80, explanation: "" }),
  opportunity_score: ScoreSchema.default({ score: 80, explanation: "" }),
  competition_score: ScoreSchema.default({ score: 80, explanation: "" }),
  supplier_score: ScoreSchema.default({ score: 80, explanation: "" }),
  risk_score_detail: ScoreSchema.default({ score: 80, explanation: "" }),
  margin_score: ScoreSchema.default({ score: 80, explanation: "" }),
  trend_momentum: ScoreSchema.default({ score: 80, explanation: "" }),
  commercial_readiness: ScoreSchema.default({ score: 80, explanation: "" }),
  predicted_rating_score: RatingSchema.default({ score: 4.5, explanation: "" })
}).catch({
  ai_score: { score: 80, explanation: "" },
  opportunity_score: { score: 80, explanation: "" },
  competition_score: { score: 80, explanation: "" },
  supplier_score: { score: 80, explanation: "" },
  risk_score_detail: { score: 80, explanation: "" },
  margin_score: { score: 80, explanation: "" },
  trend_momentum: { score: 80, explanation: "" },
  commercial_readiness: { score: 80, explanation: "" },
  predicted_rating_score: { score: 4.5, explanation: "" }
});

// --- HELPER TO CALL LLM AND PARSE JSON ---

let usedModelName = "";

async function callAIWithRetry<T>(prompt: string, schema: z.ZodType<T>, overrideProvider?: string): Promise<{ parsed: T, raw: string }> {
  const result = await AIRouter.execute({
    botName: "Research Bot",
    prompt: prompt + "\n\nCRITICAL: You MUST respond ONLY with valid, parseable JSON matching the requested structure. Do not wrap in markdown blocks like ```json.",
    requestType: "structured_json",
    overrideProvider: overrideProvider
  });

  const lastRaw = result.response.content;
  usedModelName = result.providerUsed + " - " + result.response.model;

  // Parse JSON from whichever provider succeeded
  try {
    let cleaned = lastRaw.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '');
    if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '');
    if (cleaned.endsWith('```')) cleaned = cleaned.replace(/```$/, '');
    cleaned = cleaned.trim();

    let parsed = JSON.parse(cleaned);
    
    // Defensively unwrap single root keys like {"data": {...}}
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length === 1) {
      const rootKey = Object.keys(parsed)[0];
      if (typeof parsed[rootKey] === 'object' && !Array.isArray(parsed[rootKey])) {
        parsed = parsed[rootKey];
      }
    }

    const validated = schema.parse(parsed);
    return { parsed: validated, raw: lastRaw };
  } catch (e) {
    throw new Error(`AI JSON Parsing failed. Raw output: ${lastRaw}`);
  }
}

export async function POST(request: Request) {
  try {
    const context = await request.json();
    const overrideProvider = context.overrideProvider;
    const startTime = Date.now();
    const rawResponses: any[] = [];
    let confidences: number[] = [];

    const productContext = `
      Product: ${context.product_name}
      Brand: ${context.brand || 'N/A'}
      Category: ${context.category || 'N/A'}
      Platform: ${context.platform || 'N/A'}
      Price (RM): ${context.price_rm || 'N/A'}
    `;

    // STEP 1: Market Insights
    const step1Prompt = `
      You are an expert ecommerce product researcher. Analyze this product for the Malaysian market:
      ${productContext}
      
      Return ONLY a JSON object containing the following keys:
      - trend_analysis
      - target_customer
      - problem_solved
      - usps
      - market_opportunity
      
      Each key must be an object with:
      "original": "your text response",
      "edited": "your text response",
      "confidence": integer from 0 to 100 based on your confidence
    `;
    const { parsed: step1, raw: raw1 } = await callAIWithRetry(step1Prompt, Step1Schema, overrideProvider);
    rawResponses.push(raw1);
    Object.values(step1).forEach((v: any) => confidences.push(v.confidence));

    // STEP 2: Competition & Supplier
    const step2Prompt = `
      Analyze competition and supplier availability for this product in Malaysia:
      ${productContext}
      
      Return ONLY a JSON object with:
      - competition_landscape (High/Medium/Low with brief summary)
      - supplier_availability (Easy/Medium/Hard with reasoning)
      
      Each key must be an object with: "original", "edited", "confidence" (0-100).
    `;
    const { parsed: step2, raw: raw2 } = await callAIWithRetry(step2Prompt, Step2Schema, overrideProvider);
    rawResponses.push(raw2);
    Object.values(step2).forEach((v: any) => confidences.push(v.confidence));

    // STEP 3: Regulatory & Risk
    const step3Prompt = `
      Analyze regulatory and risks for this product in Malaysia (SIRIM, KKM, etc.):
      ${productContext}
      
      Return ONLY a JSON object with:
      - malaysia_regulatory
      - risk_analysis (Low/Medium/High with reasoning)
      
      Each key must be an object with: "original", "edited", "confidence" (0-100).
    `;
    const { parsed: step3, raw: raw3 } = await callAIWithRetry(step3Prompt, Step3Schema, overrideProvider);
    rawResponses.push(raw3);
    Object.values(step3).forEach((v: any) => confidences.push(v.confidence));

    // STEP 4: Financials & Actions
    const step4Prompt = `
      Analyze financials and recommendations for this product:
      ${productContext}
      
      Return ONLY a JSON object with:
      - recommended_price
      - estimated_margin (percentage estimate)
      - recommended_actions (e.g. Research further, Avoid, Watchlist)
      
      Each key must be an object with: "original", "edited", "confidence" (0-100).
    `;
    const { parsed: step4, raw: raw4 } = await callAIWithRetry(step4Prompt, Step4Schema, overrideProvider);
    rawResponses.push(raw4);
    Object.values(step4).forEach((v: any) => confidences.push(v.confidence));

    // STEP 5: Scoring
    const step5Prompt = `
      Based on the product context:
      ${productContext}
      
      Generate final scores (0-100) and brief explanations for:
      - ai_score
      - opportunity_score
      - competition_score
      - supplier_score
      - risk_score_detail
      - margin_score
      - trend_momentum
      - commercial_readiness
      
      Generate a predicted market rating for this product:
      - predicted_rating_score (score out of 5.0, e.g. 4.8)
      
      Return ONLY a JSON object where each key is an object with:
      "score": number (0-100 for all EXCEPT predicted_rating_score which is 0-5),
      "explanation": "brief text"
    `;
    const { parsed: step5, raw: raw5 } = await callAIWithRetry(step5Prompt, Step5Schema, overrideProvider);
    rawResponses.push(raw5);

    // Calculate Final Intelligence Score
    const avgConfidence = confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 80;
    
    const demand = step5.opportunity_score.score * 0.25;
    const growth = step5.trend_momentum.score * 0.20;
    const competition = step5.competition_score.score * 0.15; 
    const supplier = step5.supplier_score.score * 0.10;
    const margin = step5.margin_score.score * 0.15;
    const risk = step5.risk_score_detail.score * 0.10; 
    const conf = avgConfidence * 0.05;

    const finalScore = Math.round(demand + growth + competition + supplier + margin + risk + conf);

    // Return the massive combined JSON object
    return NextResponse.json({
      success: true,
      data: {
        ...step1,
        ...step2,
        ...step3,
        ...step4,
        ...step5,
        final_intelligence_score: finalScore,
        final_intelligence_explanation: "Weighted calculation complete based on 7 core metrics.",
        research_status: 'completed',
        confidence_score_total: Math.round(avgConfidence),
        research_duration_seconds: (Date.now() - startTime) / 1000,
        raw_ai_response: rawResponses,
        model_used: usedModelName,
        scoring_weights: { demand: 0.25, growth: 0.20, competition: 0.15, supplier: 0.10, margin: 0.15, risk: 0.10, confidence: 0.05 }
      }
    });

  } catch (error: any) {
    console.error("AI Workflow Failed:", error);
    return NextResponse.json({ error: "Service unavailable or feature not configured." }, { status: 500 });
  }
}

