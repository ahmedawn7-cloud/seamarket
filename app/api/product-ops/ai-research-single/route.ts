import { NextResponse } from 'next/server';
import { AIRouter } from '@/lib/ai/AIRouter';
import { z } from 'zod';

// Flexible string coercer
const flexibleString = z.any().transform(val => {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.join('\n- ');
  if (val && typeof val === 'object') return JSON.stringify(val);
  if (val === null || val === undefined) return "";
  return String(val);
}).catch("");

const flexibleNumber = z.coerce.number().catch(80).transform(val => {
  if (isNaN(val)) return 80;
  return Math.min(Math.max(val, 0), 100);
});

const ConfidenceSchema = z.object({
  original: flexibleString,
  edited: flexibleString,
  confidence: flexibleNumber
}).catch({ original: "Data unavailable", edited: "Data unavailable", confidence: 80 });

export async function POST(request: Request) {
  try {
    const { form, field, bot } = await request.json();

    const productContext = `
      Product: ${form.product_name}
      Brand: ${form.brand || 'N/A'}
      Category: ${form.category || 'N/A'}
      Platform: ${form.platform || 'N/A'}
      Price (RM): ${form.price_rm || 'N/A'}
    `;

    // Map field to a specific prompt
    let prompt = "";
    if (["trend_analysis", "target_customer", "problem_solved", "usps", "market_opportunity"].includes(field)) {
      prompt = `
      You are an expert ecommerce product researcher. Analyze this product for the Malaysian market:
      ${productContext}
      
      Return ONLY a JSON object containing the exact key: "${field}"
      
      The value for "${field}" MUST be an object with:
      "original": "your text response",
      "edited": "your text response",
      "confidence": integer from 0 to 100 based on your confidence
      `;
    } else if (["competition_landscape", "supplier_availability"].includes(field)) {
      prompt = `
      Analyze competition and supplier availability for this product in Malaysia:
      ${productContext}
      
      Return ONLY a JSON object containing the exact key: "${field}"
      
      The value for "${field}" MUST be an object with:
      "original": "your text response",
      "edited": "your text response",
      "confidence": integer from 0 to 100 based on your confidence
      `;
    } else if (["malaysia_regulatory", "risk_analysis"].includes(field)) {
      prompt = `
      Analyze regulatory and risks for this product in Malaysia (SIRIM, KKM, etc.):
      ${productContext}
      
      Return ONLY a JSON object containing the exact key: "${field}"
      
      The value for "${field}" MUST be an object with:
      "original": "your text response",
      "edited": "your text response",
      "confidence": integer from 0 to 100 based on your confidence
      `;
    } else if (["recommended_price", "estimated_margin", "recommended_actions"].includes(field)) {
      prompt = `
      Analyze financials and recommendations for this product:
      ${productContext}
      
      Return ONLY a JSON object containing the exact key: "${field}"
      
      The value for "${field}" MUST be an object with:
      "original": "your text response",
      "edited": "your text response",
      "confidence": integer from 0 to 100 based on your confidence
      `;
    } else {
      return NextResponse.json({ error: "Invalid field for targeted regeneration" }, { status: 400 });
    }

    const fullPrompt = prompt + "\n\nCRITICAL: You MUST respond ONLY with valid, parseable JSON. Do not wrap in markdown blocks like ```json.";

    let res;
    try {
      const result = await AIRouter.execute({
        botName: "Research Bot",
        prompt: fullPrompt,
        requestType: "structured_json",
        overrideProvider: bot === 'Auto' ? undefined : bot
      });
      res = result.response;
    } catch (e: any) {
      return NextResponse.json({ error: `AI Router failed: ${e.message}` }, { status: 500 });
    }

    let lastRaw = res.content || "";
    let cleaned = lastRaw.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '');
    if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '');
    if (cleaned.endsWith('```')) cleaned = cleaned.replace(/```$/, '');
    cleaned = cleaned.trim();

    let parsed = JSON.parse(cleaned);
    
    // Defensively unwrap single root keys like {"data": {...}} or {"result": {...}} if they don't match our field
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length === 1) {
      const rootKey = Object.keys(parsed)[0];
      if (rootKey !== field && typeof parsed[rootKey] === 'object' && !Array.isArray(parsed[rootKey])) {
        parsed = parsed[rootKey];
      }
    }

    // Extract the specific field data
    let fieldData = parsed[field];
    
    // If it's totally missing, check if they just returned the inner object directly
    if (!fieldData && parsed.original !== undefined) {
      fieldData = parsed;
    }

    if (!fieldData) {
      throw new Error(`Model did not return the requested field "${field}"`);
    }

    const validated = ConfidenceSchema.parse(fieldData);
    
    return NextResponse.json({ success: true, data: validated });
  } catch (error: any) {
    console.error("Single AI workflow failed:", error);
    return NextResponse.json({ error: "Service unavailable or feature not configured." }, { status: 500 });
  }
}

