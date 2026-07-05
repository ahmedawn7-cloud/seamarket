import type { ChatApiResponse, ChatMessage, PasarAIResponse } from "@/types/chat";

const CHAT_TIMEOUT_MS = 12000;

export async function sendPasarAIMessage(
  messages: ChatMessage[],
  role: "main" | "research" = "main",
  options?: {
    conversationId?: string;
    userId?: string;
    explicitProductIds?: string[];
    selectedProduct?: unknown;
    savedNotes?: unknown[];
  },
): Promise<PasarAIResponse> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, role, ...options }),
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as ChatApiResponse | { error?: string } | null;

    if (!response.ok) {
      throw new Error(payload && "error" in payload && payload.error ? payload.error : "Pasar AI server error.");
    }

    if (!payload || !("response" in payload) || !payload.response) {
      throw new Error("Pasar AI returned an empty reply.");
    }

    const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content || "";

    return {
      content: payload.response.answer,
      intent: payload.intent,
      confidence: payload.confidence,
      sources: payload.response.sources,
      recommendations: payload.response.recommendations,
      actions: detectTrackingActions(lastUserMessage),
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Pasar AI took too long to respond. Please try again.");
    }

    if (error instanceof Error) {
      if (/fetch failed|failed to fetch|networkerror/i.test(error.message)) {
        throw new Error("Pasar AI is not connected. Check AI_PROVIDER and model configuration.");
      }
      throw error;
    }

    throw new Error("Pasar AI request failed.");
  } finally {
    window.clearTimeout(timeout);
  }
}

function detectTrackingActions(message: string) {
  const text = message.toLowerCase();
  const actions = [];
  const trackMatch = message.match(/(?:track|monitor|save)\s+(?:this\s+)?(?:product|item)\s+(.+)/i);
  const categoryMatch = message.match(/(?:track|monitor|save)\s+(?:the\s+)?(?:category|niche)\s+(.+)/i);

  if (trackMatch?.[1]) {
    const value = cleanActionValue(trackMatch[1]);
    actions.push({ type: "track_product" as const, label: `Track product: ${value}`, value });
  }

  if (categoryMatch?.[1]) {
    const value = cleanActionValue(categoryMatch[1]);
    actions.push({ type: "track_category" as const, label: `Track category: ${value}`, value });
  }

  if (actions.length === 0 && (text.includes("petshop") || text.includes("pet shop") || text.includes("pet products"))) {
    actions.push({ type: "track_category" as const, label: "Track category: Pet products", value: "Pet products" });
  }

  return actions;
}

function cleanActionValue(value: string) {
  return value
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}
