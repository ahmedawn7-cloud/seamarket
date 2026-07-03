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
};

type ScraperStatus = {
  ok: boolean;
  generatedAt: string;
  environment: Record<string, any>;
  scrapers: Array<Record<string, any>>;
  recommendedTables: string[];
};

export default function OperationsCenter() {
  const [health, setHealth] = useState<OpsHealth | null>(null);
  const [scrapers, setScrapers] = useState<ScraperStatus | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOpsData();
  }, []);

  async function loadOpsData() {
    setStatus("loading");
    setError("");

    try {
      const [healthResponse, scraperResponse] = await Promise.all([
        fetch("/api/ops/health", { cache: "no-store" }),
        fetch("/api/ops/scrapers", { cache: "no-store" }),
      ]);

      const [healthPayload, scraperPayload] = await Promise.all([healthResponse.json(), scraperResponse.json()]);

      if (!healthResponse.ok) {
        throw new Error(healthPayload.error || "Operations health request failed.");
      }

      setHealth(healthPayload);
      setScrapers(scraperPayload);
      setStatus("ready");
    } catch (requestError) {
      setStatus("error");
      setError(requestError instanceof Error ? requestError.message : "Operations request failed.");
    }
  }

  const healthScore = useMemo(() => {
    if (!health) return 0;
    const checks = [
      health.ok,
      health.database.connected,
      health.env.supabaseUrl,
      health.env.supabaseAnonKey,
      health.env.aiProvider === "groq" ? health.env.groqApiKey : true,
      health.scraper.requirements.productTableReachable,
      health.scraper.requirements.productRowsAvailable,
    ];
    const passed = checks.filter(Boolean).length;
    return Math.round((passed / checks.length) * 100);
  }, [health]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Backend operations</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Operations Center</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Site health, Supabase diagnostics, AI readiness, Telegram status, and the foundation for scraper bot operations.
          </p>
        </div>
        <button
          onClick={loadOpsData}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#0d1322] px-4 py-3 text-sm font-bold text-cyan-300 transition hover:border-cyan-400"
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
          value={status === "loading" ? "Checking" : `${healthScore}%`}
          tone={healthScore >= 80 ? "good" : healthScore >= 50 ? "warn" : "bad"}
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
          tone={health?.scraper.status === "ready_for_planning" ? "good" : "warn"}
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
            <p className="text-sm text-slate-400">No critical warnings detected.</p>
          )}
        </Panel>
      </div>

      <Panel title="Database Health" icon={Database}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="border-b border-slate-800 py-3">Table</th>
                <th className="border-b border-slate-800 py-3">Status</th>
                <th className="border-b border-slate-800 py-3">Rows</th>
                <th className="border-b border-slate-800 py-3">Sample</th>
                <th className="border-b border-slate-800 py-3">Latency</th>
                <th className="border-b border-slate-800 py-3">Columns</th>
              </tr>
            </thead>
            <tbody>
              {health?.database.tables.map((table) => (
                <tr key={table.table} className="text-slate-300">
                  <td className="border-b border-slate-800 py-3 font-bold text-white">{table.table}</td>
                  <td className="border-b border-slate-800 py-3">
                    <StatusPill ok={table.reachable} label={table.reachable ? "Reachable" : "Error"} />
                  </td>
                  <td className="border-b border-slate-800 py-3">{table.count ?? 0}</td>
                  <td className="border-b border-slate-800 py-3">{table.sampleRows ?? 0}</td>
                  <td className="border-b border-slate-800 py-3">{table.latencyMs} ms</td>
                  <td className="border-b border-slate-800 py-3 text-xs text-slate-500">
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
              <div key={bot.id || bot.name} className="rounded-xl border border-slate-800 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-white">{bot.name}</h3>
                  <StatusPill ok={bot.status === "ai_ready" || bot.status === "planned"} label={bot.status || "planned"} />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">{bot.purpose || bot.nextMilestone}</p>
                {bot.cadence && <p className="mt-3 text-xs text-cyan-300">Cadence: {bot.cadence}</p>}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Next Tables" icon={Database}>
          <div className="space-y-2">
            {(scrapers?.recommendedTables || []).map((table) => (
              <div key={table} className="rounded-lg border border-slate-800 bg-black/20 px-3 py-2 text-sm font-medium text-slate-300">
                {table}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-[#0d1322] p-5">
      <div className="mb-4 flex items-center gap-3">
        <Icon className="h-5 w-5 text-cyan-300" />
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function HealthCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: "good" | "warn" | "bad" }) {
  const toneClass = tone === "good" ? "text-emerald-300" : tone === "warn" ? "text-amber-300" : "text-red-300";
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-4">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Icon className={`h-4 w-4 ${toneClass}`} />
        {label}
      </div>
      <p className={`mt-3 text-2xl font-bold capitalize ${toneClass}`}>{value}</p>
    </div>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-black/20 p-3">
      <span className="text-sm text-slate-400">{label}</span>
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
