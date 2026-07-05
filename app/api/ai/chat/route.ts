import { NextResponse } from "next/server";
import { PasarAIEngine } from "@/lib/ai/services/PasarAI";
import { mockPasarAI } from "@/lib/chat/mockPasarAI";

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

    const { conversationId, userId, explicitProductIds, role, selectedProduct, savedNotes } = body;
    const provider = (process.env.AI_PROVIDER || "ollama").trim().toLowerCase();

    if (provider === "mock" && process.env.NODE_ENV !== "production") {
      const mock = await mockPasarAI(latestUserMessage.content);
      return NextResponse.json({
        conversationId: conversationId || `mock-${Date.now()}`,
        intent: role === "research" ? "research_workspace" : "general_business",
        confidence: 42,
        response: {
          answer: mock.content,
          sources: [],
          recommendations: [],
        },
      });
    }

    const contextualPrompt = buildContextualPrompt({
      latestMessage: latestUserMessage.content,
      role,
      selectedProduct,
      savedNotes,
    });

    const engine = new PasarAIEngine();
    const result = await engine.processRequest(
      contextualPrompt,
      conversationId,
      userId,
      explicitProductIds
    );

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Pasar AI Error:", error);
    const message = error instanceof Error ? error.message : "Pasar AI server error.";
    const status = message.includes("timed out") ? 504 : message.includes("not connected") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

function buildContextualPrompt({
  latestMessage,
  role,
  selectedProduct,
  savedNotes,
}: {
  latestMessage: string;
  role?: string;
  selectedProduct?: unknown;
  savedNotes?: unknown;
}) {
  const contextBlocks: string[] = [];

  if (role === "research") {
    contextBlocks.push("Workspace: Research Hub");
  }

  if (selectedProduct && typeof selectedProduct === "object") {
    const product = selectedProduct as Record<string, unknown>;
    const productName =
      product.clean_name_ai || product.Clean_Name_AI || product.product_name || product.Product_Name || "Selected product";
    contextBlocks.push(`Selected product context: ${String(productName)}`);
  }

  if (Array.isArray(savedNotes) && savedNotes.length > 0) {
    const notePreview = savedNotes
      .map((note) => {
        if (typeof note === "string") return note;
        if (note && typeof note === "object" && "content" in note) return String((note as { content?: string }).content || "");
        return "";
      })
      .filter(Boolean)
      .slice(0, 2)
      .join("\n---\n")
      .slice(0, 1200);

    if (notePreview) {
      contextBlocks.push(`Saved research notes:\n${notePreview}`);
    }
  }

  if (contextBlocks.length === 0) {
    return latestMessage;
  }

  return `${contextBlocks.join("\n\n")}\n\nUser request: ${latestMessage}`;
}

