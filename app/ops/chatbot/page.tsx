import { OpsHeader, OpsList, OpsMetric, OpsPanel, StatusPill } from "@/components/ops/OpsPrimitives";

export default function ChatbotOpsPage() {
  const aiProvider = process.env.AI_PROVIDER || "mock";
  const hasGroq = Boolean(process.env.GROQ_API_KEY);

  return (
    <section className="space-y-6">
      <OpsHeader
        eyebrow="Pasar AI"
        title="Chatbot Operations"
        description="Monitor the Pasar AI assistant architecture, provider readiness, safety boundaries, and the future path toward product-aware agent actions."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <OpsMetric label="Provider" value={aiProvider} tone={aiProvider === "groq" && hasGroq ? "good" : "warn"} />
        <OpsMetric label="Endpoint" value="/api/chat" />
        <OpsMetric label="Frontend" value="global widget" />
        <OpsMetric label="Mode" value="seller BI" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <OpsPanel title="Assistant Boundaries">
          <OpsList
            items={[
              "Only answer ecommerce, Shopee, Lazada, TikTok Shop, supplier, profit, product research, and Malaysian compliance questions.",
              "Reject unrelated politics, religion, medical, non-ecommerce legal, and investment questions.",
              "Always say when uncertain instead of inventing facts.",
              "Keep AI insights as estimates and ask users to verify before business decisions.",
            ]}
          />
        </OpsPanel>

        <OpsPanel title="Provider Status">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-black/20 p-3">
              <span className="text-sm text-slate-300">Groq</span>
              <StatusPill ok={hasGroq} label={hasGroq ? "connected" : "missing"} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-black/20 p-3">
              <span className="text-sm text-slate-300">Mock fallback</span>
              <StatusPill ok label="ready" />
            </div>
          </div>
        </OpsPanel>
      </div>

      <OpsPanel title="Future Agent Actions">
        <OpsList
          items={[
            "Save tracked product or category to user_watchlist with user confirmation.",
            "Pull matching products from MYProductScout_Master before answering product research questions.",
            "Create research notes for the current user from chatbot tasks.",
            "Send Telegram alerts when tracked product/category signals change.",
            "Apply per-user AI quotas before public launch.",
          ]}
        />
      </OpsPanel>
    </section>
  );
}
