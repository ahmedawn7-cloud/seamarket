import { Bot, User } from "lucide-react";
import type { ChatMessage as ChatMessageType, PasarAIAction } from "@/types/chat";

export default function ChatMessage({
  message,
  actions = [],
  onAction,
}: {
  message: ChatMessageType;
  actions?: PasarAIAction[];
  onAction?: (action: PasarAIAction) => void;
}) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={`flex gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}>
      {isAssistant && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--muted)] text-[var(--primary)]">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div className={`max-w-[82%] ${isAssistant ? "" : "order-first"}`}>
        <div
          className={`whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
            isAssistant
              ? "border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
              : "bg-[var(--primary)] text-[var(--primary-foreground)]"
          }`}
        >
          {message.content}
        </div>
        {isAssistant && actions.length > 0 && (
          <div className="mt-2 space-y-2">
            {actions.map((action) => (
              <button
                key={`${action.type}-${action.value}`}
                onClick={() => onAction?.(action)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-left text-xs font-bold text-[var(--primary)] transition hover:border-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {!isAssistant && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
