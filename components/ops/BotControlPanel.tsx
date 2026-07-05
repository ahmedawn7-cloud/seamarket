"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Database, Play, RefreshCw, Rocket } from "lucide-react";
import { OpsList, OpsPanel, StatusPill } from "@/components/ops/OpsPrimitives";

const tables = ["MYProductScout_Master", "scraped_products_staging", "product_research_scores", "scraper_runs"];
const platforms = ["Shopee", "Lazada", "TikTok Shop", "Internal"];

export default function BotControlPanel({
  botName,
  mode,
  defaultSource = "scraped_products_staging",
}: {
  botName: string;
  mode: "scraper" | "cleaner" | "research";
  defaultSource?: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [platform, setPlatform] = useState(platforms[0]);
  const [sourceTable, setSourceTable] = useState(defaultSource);
  const [targetTable, setTargetTable] = useState(mode === "scraper" ? "scraped_products_staging" : "MYProductScout_Master");
  const [targetRows, setTargetRows] = useState("100");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("");
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [readiness, setReadiness] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadReadiness() {
      const payload = await getJson("/api/ops/health");
      if (!isMounted) return;
      setReadiness(payload);
    }

    loadReadiness();

    return () => {
      isMounted = false;
    };
  }, []);

  const botGate = useMemo(() => {
    const key = mode === "research" ? "researcher" : mode;
    return readiness?.botReadiness?.find((bot: any) => bot.bot === key) || null;
  }, [mode, readiness]);
  const gateBlocksRun = !botGate?.ready;
  const gateMessage = getGateMessage(botGate);

  async function queueRun() {
    setBusy(true);
    setStatus("Queueing bot run...");
    setDiagnostic(null);

    const payload = await postJson("/api/ops/runs", {
      botName,
      platform,
      dateFrom,
      dateTo,
      targetTable,
      targetRows,
    });

    setDiagnostic(payload);
    setStatus(payload.ok ? `Run queued: ${payload.run?.id || "created"}` : `Run failed: ${payload.error}`);
    setBusy(false);
  }

  async function evaluateTable() {
    setBusy(true);
    setStatus("Evaluating selected table...");
    setDiagnostic(null);

    const dateField = sourceTable === "MYProductScout_Master" ? "Scrape_Date" : sourceTable === "scraped_products_staging" ? "scrape_date" : "";
    const payload = await postJson("/api/ops/evaluate", {
      table: sourceTable,
      dateField,
      dateFrom,
      dateTo,
    });

    setDiagnostic(payload);
    setStatus(payload.ok ? `Evaluation complete: ${payload.count ?? 0} rows detected.` : `Evaluation failed: ${payload.error}`);
    setBusy(false);
  }

  async function promoteToMaster() {
    setBusy(true);
    setStatus("Promoting staged products to master table...");
    setDiagnostic(null);

    const payload = await postJson("/api/ops/promote", {
      sourceTable,
      targetTable: "MYProductScout_Master",
      limit: Number(targetRows) || 25,
      confirm,
    });

    setDiagnostic(payload);
    setStatus(payload.ok ? `Promoted ${payload.promoted} products to master.` : `Promotion blocked: ${payload.error}`);
    setBusy(false);
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <OpsPanel title={`${botName} Control Console`}>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date from" value={dateFrom} onChange={setDateFrom} type="date" />
            <Field label="Date to" value={dateTo} onChange={setDateTo} type="date" />
          </div>

          <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Platform
            <select value={platform} onChange={(event) => setPlatform(event.target.value)} className="ops-input">
              {platforms.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Source table
            <select value={sourceTable} onChange={(event) => setSourceTable(event.target.value)} className="ops-input">
              {tables.map((table) => (
                <option key={table}>{table}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Target table
            <select value={targetTable} onChange={(event) => setTargetTable(event.target.value)} className="ops-input">
              {tables.map((table) => (
                <option key={table}>{table}</option>
              ))}
            </select>
          </label>

          <Field label="Target / limit rows" value={targetRows} onChange={setTargetRows} type="number" />

          <div className="grid gap-3">
            <button onClick={queueRun} disabled={busy || gateBlocksRun} className="ops-action disabled:cursor-not-allowed disabled:opacity-50">
              <Play className="h-4 w-4" />
              Queue bot run
            </button>
            <button onClick={evaluateTable} disabled={busy || !readiness?.database?.connected} className="ops-action-secondary disabled:cursor-not-allowed disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
              Evaluate selected table
            </button>
          </div>

          {gateMessage && (
            <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-200">
              {gateMessage}
            </div>
          )}

          <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
            <div className="flex items-center gap-2 text-amber-200">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-bold">Promote to master</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-amber-100/80">
              This inserts staged rows into MYProductScout_Master using the exact master attribute mapping. Type PROMOTE to unlock.
            </p>
            <input
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="Type PROMOTE"
              className="ops-input mt-3"
            />
            <button onClick={promoteToMaster} disabled={busy || confirm !== "PROMOTE" || !readiness?.database?.connected} className="ops-danger mt-3 disabled:cursor-not-allowed disabled:opacity-50">
              <Rocket className="h-4 w-4" />
              Push staged products to master
            </button>
          </div>
        </div>
      </OpsPanel>

      <OpsPanel title="Diagnostic Output">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-300">
            <Database className="h-4 w-4 text-emerald-300" />
            <span className="text-sm">{status || "Waiting for operator action."}</span>
          </div>
          <StatusPill ok={Boolean(diagnostic?.ok)} label={diagnostic?.ok ? "ok" : "idle"} />
        </div>

        {diagnostic ? (
          <div className="space-y-4">
            {diagnostic.quality && (
              <div className="grid gap-3 md:grid-cols-4">
                {Object.entries(diagnostic.quality).map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-border bg-muted p-3">
                    <p className="text-xs text-slate-500">{key}</p>
                    <p className="mt-1 text-xl font-bold text-emerald-300">{String(value)}%</p>
                  </div>
                ))}
              </div>
            )}
            {diagnostic.missingMasterColumns?.length > 0 && (
              <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3">
                <p className="mb-2 text-sm font-bold text-amber-200">Missing master attributes</p>
                <OpsList items={diagnostic.missingMasterColumns} />
              </div>
            )}
            <pre className="max-h-[520px] overflow-auto rounded-xl border border-border bg-[#020812] p-4 text-xs leading-5 text-emerald-200">
              {JSON.stringify(diagnostic, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/50 p-8 text-center text-sm text-slate-500">
            Select dates and a table, then queue/evaluate to see Supabase diagnostics.
          </div>
        )}
      </OpsPanel>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} type={type} className="ops-input" />
    </label>
  );
}

async function postJson(url: string, body: any) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    return payload;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Request failed." };
  }
}

async function getJson(url: string) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    return await response.json();
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Readiness request failed." };
  }
}

function getGateMessage(botGate: any) {
  if (!botGate) return "API failing: bot readiness could not be loaded yet.";
  if (botGate.status === "missing_environment_variable") {
    return `Missing environment variable: ${botGate.missingEnv?.join(", ") || "required bot secret"}.`;
  }
  if (botGate.status === "missing_table_or_column") {
    return `Missing table/column: ${botGate.missingTables?.join(", ") || "required bot schema"}.`;
  }
  if (botGate.status === "demo_adapter_only") {
    return "Demo adapter data — real marketplace connection not active yet.";
  }
  if (!botGate.ready) return "API failing: bot is not ready to run.";
  return "";
}
