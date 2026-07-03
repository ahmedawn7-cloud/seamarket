import { NextResponse } from "next/server";
import { PasarAIEngine } from "@/lib/ai/services/PasarAI";

export const maxDuration = 300; // Allow 5 mins for RAG pipeline

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    
    if (!body || !body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    const latestUserMessage = [...body.messages].reverse().find((m) => m.role === "user");
    if (!latestUserMessage?.content.trim()) {
      return NextResponse.json({ error: "User message is required." }, { status: 400 });
    }

    const { conversationId, userId, explicitProductIds } = body;

    const engine = new PasarAIEngine();
    const result = await engine.processRequest(
      latestUserMessage.content,
      conversationId,
      userId,
      explicitProductIds
    );

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Pasar AI Error:", error);
    const message = error instanceof Error ? error.message : "Pasar AI server error.";
    const status = message.includes("timed out") ? 504 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
