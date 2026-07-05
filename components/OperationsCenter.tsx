"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Bot, CheckCircle2, Database, RefreshCw, Server, ShieldCheck } from "lucide-react";

type OpsHealth = {
  ok: boolean;
  generatedAt: string;
  site: Record<string, any>;
  env: Record<string, any>;
  database: {
    connected: boolean;
    tables: Array<Record<string, any>>;
    productSchema?: {
      missingColumns: string[];
    };
    warnings?: string[];
  };
  scraper: {
    status: string;
    bots: Array<Record<string, any>>;
    requirements: Record<string, boolean>;
  };
  missingEnvironmentVariables?: string[];
  botReadiness?: Array<{
    bot: string;
    ready: boolean;
    status: string;
    missingTables: string[];
    missingEnv: string[];
    demoAdapterOnly?: boolean;
    message?: string;
  }>;
};

type ScraperStatus = {
  ok: boolean;
  generatedAt: string;
  environment: Record<string, any>;
  scrapers: Array<Record<string, any>>;
  recommendedTables: string[];
};

type RecommendationStatus = {
  ok: boolean;
  queue: Array<{
    id: string;
    product_name: string;
    platform: string;
    category: string;
    status: string;
    featured: boolean;
    created_at: string;
    contributor_name: string;
    contributor_rank: string;
    promoted_to_ops: boolean;
  }>;
  summary: {
    totalVisible: number;
    pendingReview: number;
    needsInfo: number;
    approved: number;
    promotedToOps: number;
  } | null;
  error?: string;
};

export default function OperationsCenter() {
  const [health, setHealth] = useState<OpsHealth | null>(null);
  const [scrapers, setScrapers] = useState<ScraperStatus | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationStatus | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOpsData();
  }, []);

  async function loadOpsData() {
    setStatus("loading");
    setError("");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12000);

    try {
      const [healthResponse, scraperResponse] = await Promise.all([
        fetch("/api/ops/health", { cache: "no-store", signal: controller.signal }),
        fetch("/api/ops/scrapers", { cache: "no-store", signal: controller.signal }),
      ]);

      const [healthPayload, scraperPayload] = await Promise.all([
        healthResponse.json().catch(() => null),
        scraperResponse.json().catch(() => null),
      ]);

      if (!healthResponse.ok) {
        throw new Error(healthPayload?.error || "Operations health request failed.");
      }

      setHealth(healthPayload);
      setScrapers(scraperPayload || null);
      loadRecommendations();
      setStatus("ready");
    } catch (requestError) {
      setStatus("error");
      const isAbort = requestError instanceof DOMException && requestError.name === "AbortError";
      setError(isAbort ? "Operations diagnostics timed out. Refresh again after the backend finishes starting." : requestError instanceof Error ? requestError.message : "Operations request failed.");
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function loadRecommendations() {
    try {
      const response = await fetch("/api/ops/recommendations", { cache: "no-store" });
      const payload = await response.json();
      setRecommendations(payload);
    } catch {
      setRecommendations({
        ok: false,
        queue: [],
        summary: null,
        error: "Recommendation queue could not be loaded.",
      });
    }
  }

  const healthScore = useMemo(() => {
    if (!health) return 0;
    const checks = [
      health.ok,
      health.database.connected,
      health.env.supabaseUrl,
      health.env.supabaseAnonKey,
      health.env.supabaseServiceRoleKey,
      health.env.scraperSecret,
      health.env.cleanerSecret,
      health.env.researcherSecret,
      health.env.scorerSecret,
      health.env.aiProvider === "groq" ? health.env.groqApiKey : true,
      health.scraper.requirements.productTableReachable,
      health.scraper.requirements.productRowsAvailable,
      health.scraper.requirements.productSchemaReady,
      ...(health.database.tables || []).map((table) => Boolean(table.reachable)),
      ...(health.botReadiness || []).map((bot) => Boolean(bot.ready)),
    ];
    const passed = checks.filter(Boolean).length;
    return Math.round((passed / checks.length) * 100);
  }, [health]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Backend operations</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Operations Center</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Site health, Supabase diagnostics, AI readiness, Telegram status, and the foundation for scraper bot operations.
          </p>
        </div>
        <button
          onClick={loadOpsData}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-bold text-cyan-300 transition hover:border-cyan-400"
        >
          <RefreshCw className={`h-4 w-4 ${status === "loading" ? "animate-spin" : ""}`} />
          Refresh diagnosis
        </button>
      </div>

      {status === "error" && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <HealthCard
          icon={Activity}
          label="Site Health"
          value={status === "loading" ? "Checking" : health?.ok ? `${healthScore}% Ready` : `${healthScore}% Degraded`}
          tone={health?.ok && healthScore >= 90 ? "good" : healthScore >= 50 ? "warn" : "bad"}
        />
        <HealthCard
          icon={Database}
          label="Database"
          value={health?.database.connected ? "Connected" : "Needs check"}
          tone={health?.database.connected ? "good" : "bad"}
        />
        <HealthCard
          icon={Bot}
          label="AI Provider"
          value={health?.env.aiProvider || "mock"}
          tone={health?.env.aiProvider === "groq" && health?.env.groqApiKey ? "good" : "warn"}
        />
        <HealthCard
          icon={ShieldCheck}
          label="Scraper Readiness"
          value={health?.scraper.status?.replaceAll("_", " ") || "checking"}
          tone={health?.botReadiness?.find((bot) => bot.bot === "scraper")?.ready ? "good" : "warn"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Environment Readiness" icon={Server}>
          <div className="grid gap-3 sm:grid-cols-2">
            {health &&
              Object.entries(health.env).map(([key, value]) => (
                <StatusRow key={key} label={formatLabel(key)} value={formatValue(value)} ok={Boolean(value)} />
              ))}
          </div>
        </Panel>

        <Panel title="Warnings" icon={AlertTriangle}>
          {health?.database.warnings?.length ? (
            <div className="space-y-3">
              {health.database.warnings.map((warning) => (
                <div key={warning} className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">
                  {warning}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No critical warnings detected.</p>
          )}
        </Panel>
      </div>

      <Panel title="Bot Readiness Gate" icon={ShieldCheck}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {(health?.botReadiness || []).map((bot) => (
            <div key={bot.bot} className="rounded-xl border border-border bg-muted/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold capitalize text-foreground">{bot.bot}</p>
                <StatusPill ok={bot.ready} label={formatReadinessStatus(bot.status)} />
              </div>
              {bot.missingEnv?.length > 0 && (
                <p className="mt-3 text-xs leading-5 text-amber-300">Missing environment variable: {bot.missingEnv.join(", ")}</p>
              )}
              {bot.missingTables?.length > 0 && (
                <p className="mt-3 text-xs leading-5 text-red-300">Missing table/column: {bot.missingTables.join(", ")}</p>
              )}
              {bot.demoAdapterOnly && (
                <p className="mt-3 text-xs leading-5 text-amber-300">Demo adapter data — real marketplace connection not active yet.</p>
              )}
              {bot.ready && <p className="mt-3 text-xs leading-5 text-emerald-300">Ready</p>}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Database Health" icon={Database}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="border-b border-border py-3">Table</th>
                <th className="border-b border-border py-3">Status</th>
                <th className="border-b border-border py-3">Rows</th>
                <th className="border-b border-border py-3">Sample</th>
                <th className="border-b border-border py-3">Latency</th>
                <th className="border-b border-border py-3">Columns</th>
              </tr>
            </thead>
            <tbody>
              {health?.database.tables.map((table) => (
                <tr key={table.table} className="text-muted-foreground">
                  <td className="border-b border-border py-3 font-bold text-foreground">{table.table}</td>
                  <td className="border-b border-border py-3">
                    <StatusPill ok={table.reachable} label={table.reachable ? "Ready" : "Missing table/column"} />
                  </td>
                  <td className="border-b border-border py-3">{table.count ?? 0}</td>
                  <td className="border-b border-border py-3">{table.sampleRows ?? 0}</td>
                  <td className="border-b border-border py-3">{table.latencyMs} ms</td>
                  <td className="border-b border-border py-3 text-xs text-slate-500">
                    {table.columns?.length ? `${table.columns.length} columns` : table.error?.message || "No sample"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel title="Scraper Bot Environment" icon={Bot}>
          <div className="grid gap-4 md:grid-cols-3">
            {(scrapers?.scrapers || health?.scraper.bots || []).map((bot) => (
              <div key={bot.id || bot.name} className="rounded-xl border border-border bg-muted/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-foreground">{bot.name}</h3>
                  <StatusPill ok={bot.status === "ai_ready" || bot.status === "ready"} label={formatReadinessStatus(bot.status || "planned")} />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{bot.purpose || bot.nextMilestone}</p>
                {bot.cadence && <p className="mt-3 text-xs text-cyan-300">Cadence: {bot.cadence}</p>}
                {(bot.status === "demo_adapter_only" || bot.id === "marketplace-scraper") && (
                  <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/10 p-2 text-xs text-amber-300">
                    Demo adapter data — real marketplace connection not active yet.
                  </p>
                )}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Next Tables" icon={Database}>
          <div className="space-y-2">
            {(scrapers?.recommendedTables || []).map((table) => (
              <div key={table} className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground">
                {table}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Community Recommendation Intake" icon={CheckCircle2}>
        {recommendations?.summary && (
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <HealthMini label="Visible" value={String(recommendations.summary.totalVisible)} />
            <HealthMini label="Pending Review" value={String(recommendations.summary.pendingReview)} />
            <HealthMini label="Needs Info" value={String(recommendations.summary.needsInfo)} />
            <HealthMini label="Promoted To Ops" value={String(recommendations.summary.promotedToOps)} />
          </div>
        )}

        {recommendations?.error ? (
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">
            {recommendations.error}
          </div>
        ) : recommendations?.queue?.length ? (
          <div className="space-y-3">
            {recommendations.queue.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-muted/50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{item.product_name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.platform} / {item.category} / {item.contributor_name} ({item.contributor_rank})
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill
                      ok={item.status === "approved" || item.status === "featured" || item.status === "sent_to_product_ops"}
                      label={formatReadinessStatus(item.status)}
                    />
                    {item.promoted_to_ops && <StatusPill ok={true} label="Product Ops linked" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No community recommendations are visible yet. New submissions should save into Supabase first, then appear here as recommendation intake.
          </p>
        )}
      </Panel>
    </section>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <Icon className="h-5 w-5 text-cyan-300" />
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function HealthCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: "good" | "warn" | "bad" }) {
  const toneClass = tone === "good" ? "text-emerald-300" : tone === "warn" ? "text-amber-300" : "text-red-300";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className={`h-4 w-4 ${toneClass}`} />
        {label}
      </div>
      <p className={`mt-3 text-2xl font-bold capitalize ${toneClass}`}>{value}</p>
    </div>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <StatusPill ok={ok} label={value} />
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
        ok ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"
      }`}
    >
      {ok && <CheckCircle2 className="h-3 w-3" />}
      {label}
    </span>
  );
}

function formatLabel(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function formatValue(value: any) {
  if (typeof value === "boolean") return value ? "Ready" : "Missing";
  return String(value || "Missing");
}

function formatReadinessStatus(value: string) {
  if (value === "missing_environment_variable") return "Missing environment variable";
  if (value === "missing_table_or_column") return "Missing table/column";
  if (value === "api_failing") return "API failing";
  if (value === "demo_adapter_only") return "Demo adapter only";
  if (value === "ready" || value === "ai_ready") return "Ready";
  return value.replaceAll("_", " ");
}

function HealthMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/50 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
