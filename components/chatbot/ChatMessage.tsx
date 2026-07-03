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
          {isAssistant && message.intent && message.intent !== "unsupported" && message.intent !== "general_business" && (
            <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-[var(--border)]">
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase px-2 py-1 rounded tracking-widest">{message.intent.replace("_", " ")}</span>
              {message.confidence !== undefined && (
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded tracking-widest ${message.confidence >= 80 ? 'bg-cyan-500/10 text-cyan-400' : 'bg-amber-500/10 text-amber-400'}`}>CONFIDENCE {message.confidence}%</span>
              )}
            </div>
          )}

          <div dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, "<br/>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />

          {isAssistant && message.recommendations && message.recommendations.length > 0 && (
             <div className="mt-4 pt-3 border-t border-[var(--border)]">
                <p className="text-xs font-bold uppercase text-emerald-400 mb-2 tracking-wider">Recommendations</p>
                <ul className="list-disc pl-4 space-y-1 text-xs text-[var(--muted-foreground)]">
                  {message.recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)}
                </ul>
             </div>
          )}

          {isAssistant && message.sources && message.sources.length > 0 && (
             <div className="mt-4 pt-3 border-t border-[var(--border)]">
                <p className="text-xs font-bold uppercase text-cyan-400 mb-2 tracking-wider">Sources</p>
                <div className="flex flex-wrap gap-1">
                  {message.sources.map((src, idx) => (
                    <span key={idx} className="bg-[var(--muted)] border border-[var(--border)] text-[var(--muted-foreground)] text-[10px] font-bold px-2 py-1 rounded">{src}</span>
                  ))}
                </div>
             </div>
          )}
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
