import { pasarSystemPrompt } from "@/lib/chat/pasarSystemPrompt";
import type { ChatMessage } from "@/types/chat";

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";

type GroqMessage = {
  role: "system" | "assistant" | "user";
  content: string;
};

export async function getGroqChatReply(messages: ChatMessage[]) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  const model = process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const groqMessages: GroqMessage[] = [
    { role: "system", content: pasarSystemPrompt },
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
