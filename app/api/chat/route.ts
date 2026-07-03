import { NextResponse } from "next/server";
import { mockPasarAI } from "@/lib/chat/mockPasarAI";
import { pasarSystemPrompt } from "@/lib/chat/pasarSystemPrompt";
import type { ChatApiRequest, ChatMessage } from "@/types/chat";

const SERVER_TIMEOUT_MS = 15000;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as ChatApiRequest | null;
    const messages = normalizeMessages(body?.messages);
    const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");

    if (!latestUserMessage?.content.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    if (!isAllowedPasarTopic(latestUserMessage.content)) {
      return NextResponse.json({
        reply:
          "I specialize in ecommerce intelligence for Shopee, Lazada, TikTok Shop, product research, supplier sourcing, Malaysian compliance, marketplace analytics, and seller strategy. Ask me about a product, category, margin, supplier, regulation, or marketplace decision and I will help from there.",
      });
    }

    const response = await withTimeout(
      async () => {
        // Later OpenAI connection point:
        // 1. Send pasarSystemPrompt plus messages to the OpenAI Responses API.
        // 2. Return the assistant text as { reply }.
        //
        // Later Ollama connection point:
        // 1. POST pasarSystemPrompt plus messages to your local/hosted Ollama endpoint.
        // 2. Return the model text as { reply }.
        //
        // For now, this keeps the API contract real while the intelligence remains safe mock logic.
        void pasarSystemPrompt;
        const mockReply = await mockPasarAI(latestUserMessage.content);
        return mockReply.content;
      },
      SERVER_TIMEOUT_MS,
    );

    return NextResponse.json({ reply: response });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pasar AI server error.";
    const status = message.includes("timed out") ? 504 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

function normalizeMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((message): message is ChatMessage => {
      if (!message || typeof message !== "object") return false;
      const candidate = message as Partial<ChatMessage>;
      return (candidate.role === "assistant" || candidate.role === "user") && typeof candidate.content === "string";
    })
    .slice(-20);
}

function isAllowedPasarTopic(message: string) {
  const text = message.toLowerCase();
  const allowedKeywords = [
    "shopee",
    "lazada",
    "tiktok",
    "shop",
    "ecommerce",
    "product",
    "supplier",
    "sourcing",
    "profit",
    "margin",
    "roi",
    "business",
    "seller",
    "market",
    "malaysia",
    "sirim",
    "kkm",
    "npra",
    "import",
    "compliance",
    "regulation",
    "analytics",
    "score",
    "trend",
    "title",
    "listing",
    "price",
    "sales",
    "category",
    "risk",
    "avoid",
    "track",
    "monitor",
    "save",
  ];

  return allowedKeywords.some((keyword) => text.includes(keyword));
}

async function withTimeout<T>(callback: () => Promise<T>, timeoutMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      callback(),
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Pasar AI request timed out.")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
