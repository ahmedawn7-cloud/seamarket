import { NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/supabase/serverClient";
import { AIRouter } from "@/lib/ai/AIRouter";
import { calculateStaticSeasonalScore } from "@/lib/seasonal/seasonal-scoring";
import { getMalaysiaHolidayCalendar } from "@/lib/seasonal/seasonal-calendar";
import { SeasonalEvent, AIScoreDetails, TimingStatus } from "@/lib/seasonal/seasonal-types";

export const maxDuration = 60; // Allow 60 seconds for AI execution

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, category, year, month } = body;

    if (!eventId || !category || !year || month === undefined) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const supabase = getServiceSupabaseClient();
    const calendar = getMalaysiaHolidayCalendar(year);
    const event = calendar.find((e) => e.id === eventId);
    
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 1. Check Cache
    const { data: cached, error: cacheError } = await supabase
      .from("seasonal_predictions")
      .select("*")
      .eq("year", year)
      .eq("event_id", eventId)
      .eq("category", category)
      .single();

    if (cached) {
      const validUntil = new Date(cached.valid_until);
      const now = new Date();
      if (validUntil > now) {
        return NextResponse.json({
          cached: true,
          modelUsed: cached.model_used,
          ...cached.prediction_json
        });
      }
    }

    // 2. Generate Static Fallback
    const staticScore = calculateStaticSeasonalScore(event, month);

    // 3. Call AI
    const systemPrompt = `You are a world-class e-commerce seasonal trend analyst for the Southeast Asian market (focusing on Malaysia). 
You output ONLY valid JSON.
Your task is to analyze the upcoming event/season and the specific product category, and return predictive intelligence.
Respond with this JSON structure:
{
  "explanation": "2-3 sentences explaining why this category is relevant now and the market dynamics.",
  "productIdeas": ["Specific Product 1", "Specific Product 2", "Specific Product 3"],
  "score": {
    "opportunityScore": (0-100),
    "competitionRisk": (0-100),
    "supplierReadiness": (0-100, lower if they need to source long ago),
    "campaignImpact": (0-100),
    "confidence": (0-100)
  }
}`;

    const prompt = `Event: ${event.name} (${event.approximateDate})
Category: ${category}
Current Month: Month ${month}

Please analyze this opportunity. Keep product ideas highly specific (e.g. "Waterproof anti-slip shoe covers" instead of "Shoes").`;

    try {
      const aiResponse = await AIRouter.execute({
        botName: "Research Bot",
        requestType: "chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        // temperature: 0.7, // Note: AIRouter options might not support temperature directly, we will rely on default.
      });

      const parsed = JSON.parse(aiResponse.response.content);
      
      const predictionJson = {
        timingStatus: staticScore.timingStatus, // Always use deterministic timing
        explanation: parsed.explanation || staticScore.explanation,
        productIdeas: parsed.productIdeas || [],
        score: {
          opportunityScore: parsed.score?.opportunityScore ?? staticScore.score.opportunityScore,
          competitionRisk: parsed.score?.competitionRisk ?? staticScore.score.competitionRisk,
          supplierReadiness: parsed.score?.supplierReadiness ?? staticScore.score.supplierReadiness,
          timingReadiness: staticScore.score.timingReadiness, // Deterministic
          campaignImpact: parsed.score?.campaignImpact ?? staticScore.score.campaignImpact,
          confidence: parsed.score?.confidence ?? 85,
        }
      };

      // 4. Save to Cache
      // Cache valid for 7 days
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 7);

      await supabase
        .from("seasonal_predictions")
        .upsert({
          year,
          event_id: eventId,
          category,
          model_used: aiResponse.providerUsed,
          prediction_json: predictionJson,
          valid_until: validUntil.toISOString(),
        }, { onConflict: 'year, event_id, category' });

      return NextResponse.json({
        cached: false,
        modelUsed: aiResponse.providerUsed,
        ...predictionJson
      });

    } catch (aiError) {
      console.error("AI prediction failed, using static fallback:", aiError);
      return NextResponse.json({
        cached: false,
        modelUsed: "fallback-static",
        timingStatus: staticScore.timingStatus,
        explanation: staticScore.explanation,
        productIdeas: [],
        score: staticScore.score,
      });
    }

  } catch (err) {
    console.error("Seasonal prediction error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
