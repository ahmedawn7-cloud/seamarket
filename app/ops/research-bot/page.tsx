import { OpsHeader, OpsList, OpsMetric, OpsPanel, StatusPill } from "@/components/ops/OpsPrimitives";

export default function ResearchBotOpsPage() {
  const hasGroq = Boolean(process.env.GROQ_API_KEY);

  return (
    <section className="space-y-6">
      <OpsHeader
        eyebrow="Research Bot"
        title="AI Product Research Operations"
        description="Workspace for the future AI research bot that ranks products, estimates commercial potential, generates supplier checks, and supports Pasar AI."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <OpsMetric label="AI status" value={hasGroq ? "Groq ready" : "Needs key"} tone={hasGroq ? "good" : "warn"} />
        <OpsMetric label="Input source" value="Master table" />
        <OpsMetric label="Output table" value="research scores" />
        <OpsMetric label="Mode" value="on demand" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <OpsPanel title="Research Tasks">
          <OpsList
            items={[
              "Rank weekly product opportunities using demand, margin, competition, and compliance risk.",
              "Estimate Ad_Spend_Est_RM, ROI_Calc, Revenue_Calc, Net_Margin_Calc, and Profit_Score.",
              "Suggest Supplier_Link, COGS_RM, Weight_kg, Dimensions_cm, and sourcing notes.",
              "Generate explainable summaries for Product Radar and Pasar AI.",
            ]}
          />
        </OpsPanel>

        <OpsPanel title="AI Provider">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-black/20 p-3">
              <span className="text-sm text-slate-300">Groq API</span>
              <StatusPill ok={hasGroq} label={hasGroq ? "ready" : "missing"} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-black/20 p-3">
              <span className="text-sm text-slate-300">OpenAI / Ollama fallback</span>
              <StatusPill ok={false} label="later" />
            </div>
          </div>
        </OpsPanel>
      </div>
    </section>
  );
}
