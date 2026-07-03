"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, Loader2, MessageSquareText, Minimize2, Send, Trash2, X } from "lucide-react";
import ChatMessage from "@/components/chatbot/ChatMessage";
import StarterPrompts from "@/components/chatbot/StarterPrompts";
import { sendPasarAIMessage } from "@/lib/chat/chatClient";
import type { ChatMessage as ChatMessageType, PasarAIAction } from "@/types/chat";

const TRACKED_ITEMS_KEY = "profitpilot-pasar-ai-tracked-items";

const welcomeMessage: ChatMessageType = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome to Pasar AI. I can help you think through product risk, Malaysia compliance, marketplace margin, supplier checks, listing titles, and what to monitor next.",
  createdAt: Date.now(),
};

export default function PasarAIWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessageType[]>([welcomeMessage]);
  const [pendingActions, setPendingActions] = useState<Record<string, PasarAIAction[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isOpen, isMinimized]);

  if (pathname?.startsWith("/ops")) {
    return null;
  }

  async function sendMessage(text = input) {
    const content = text.trim();
    if (!content || isLoading) return;

    const userMessage: ChatMessageType = {
      id: createId("user"),
      role: "user",
      content,
      createdAt: Date.now(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setStatus("");
    setIsLoading(true);

    try {
      const response = await sendPasarAIMessage(nextMessages);
      const assistantMessage: ChatMessageType = {
        id: createId("assistant"),
        role: "assistant",
        content: response.content,
        createdAt: Date.now(),
      };

      setMessages((current) => [...current, assistantMessage]);
      if (response.actions?.length) {
        setPendingActions((current) => ({ ...current, [assistantMessage.id]: response.actions ?? [] }));
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: createId("assistant"),
          role: "assistant",
          content: `${
            error instanceof Error ? error.message : "Pasar AI request failed."
          }\n\nPlease try again with the product, category, price, marketplace, supplier, or Malaysia compliance concern you want to analyze.\n\nAI insights are estimates only. Please verify before making business decisions.`,
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function saveTrackingAction(action: PasarAIAction) {
    const saved = loadTrackedItems();
    const exists = saved.some((item) => item.type === action.type && item.value.toLowerCase() === action.value.toLowerCase());
    const next = exists
      ? saved
      : [
          {
            ...action,
            createdAt: new Date().toISOString(),
          },
          ...saved,
        ].slice(0, 30);

    try {
      localStorage.setItem(TRACKED_ITEMS_KEY, JSON.stringify(next));
      setStatus(exists ? "Already tracking this item." : `${action.label} saved to your Pasar AI tracking list.`);
    } catch {
      setStatus("Tracking could not be saved in this browser. Your storage may be full.");
    }
  }

  function clearChat() {
    setMessages([welcomeMessage]);
    setPendingActions({});
    setStatus("");
  }

  return (
    <div className="fixed bottom-4 right-4 z-[140] sm:bottom-6 sm:right-6">
      {isOpen && !isMinimized && (
        <section className="mb-3 flex h-[min(620px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-[420px] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-2xl shadow-black/30">
          <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)] px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--primary)_16%,transparent)] text-[var(--primary)]">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--foreground)]">Pasar AI</h2>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                    Southeast Asia Seller Intelligence Assistant
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={clearChat}
                  className="rounded-lg p-2 text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                  aria-label="Clear chat"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="rounded-lg p-2 text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                  aria-label="Minimize chat"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  actions={pendingActions[message.id] ?? []}
                  onAction={saveTrackingAction}
                />
              ))}
              {isLoading && (
                <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--muted)] text-[var(--primary)]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                  Pasar AI is checking the signal...
                </div>
              )}
              {messages.length <= 1 && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-3">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
                    Starter questions
                  </p>
                  <StarterPrompts onSelect={sendMessage} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <footer className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--card)] p-4">
            {status && <p className="mb-3 rounded-xl bg-[var(--muted)] px-3 py-2 text-xs text-[var(--primary)]">{status}</p>}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
              className="flex items-end gap-2"
            >
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                rows={2}
                placeholder="Ask Pasar AI about a product, category, supplier, risk, or margin..."
                className="max-h-28 min-h-[48px] flex-1 resize-none rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </form>
          </footer>
        </section>
      )}

      <button
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className="ml-auto flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-bold text-[var(--foreground)] shadow-xl shadow-black/25 transition hover:border-[var(--primary)]"
        aria-label="Open Pasar AI chat"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]">
          <MessageSquareText className="h-5 w-5" />
        </span>
        <span className="hidden sm:block">{isMinimized ? "Pasar AI minimized" : "Ask Pasar AI"}</span>
      </button>
    </div>
  );
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadTrackedItems() {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(TRACKED_ITEMS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
