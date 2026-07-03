import { pasarSystemPrompt } from "@/lib/chat/pasarSystemPrompt";
import type { ChatMessage } from "@/types/chat";

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";

type GroqMessage = {
  role: "system" | "assistant" | "user";
  content: string;
};

const mainSystemPrompt = "You are ProfitPilot AI, a navigation and platform assistant. Help the user navigate the website, explain how to use the dashboard, understand their profile, and guide them to the Research Hub or Product Views. Be concise and friendly. If they ask deep research questions, tell them to open the Research Hub.";
const researchSystemPrompt = "You are ProfitPilot AI, a senior business intelligence analyst and ecommerce expert. Focus strictly on product research, business analysis, validation, supplier risks, margins, competition, and market opportunity. Do not answer questions outside of ecommerce/business intelligence. Give direct, data-driven, and highly analytical advice. Provide actionable 'Next Best Action' recommendations.";

export async function getGroqChatReply(messages: ChatMessage[], role: "main" | "research" = "main") {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  const model = process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const systemPrompt = role === "research" ? researchSystemPrompt : mainSystemPrompt;

  const groqMessages: GroqMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages.slice(-12).map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];

  const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: groqMessages,
      temperature: 0.35,
      max_completion_tokens: 700,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.message || `Groq request failed with ${response.status}.`);
  }

  const reply = payload?.choices?.[0]?.message?.content;

  if (!reply || typeof reply !== "string") {
    throw new Error("Groq returned an empty reply.");
  }

  return reply.trim();
}
