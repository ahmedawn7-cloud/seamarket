"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock, RefreshCcw, Shield } from "lucide-react";

export default function OpsLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => {
    const candidate = searchParams.get("next") || "/ops/dashboard";
    return candidate.startsWith("/ops") ? candidate : "/ops/dashboard";
  }, [searchParams]);

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ops/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, next: nextPath }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Access denied.");
      }

      router.replace(payload.next || nextPath);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#03080d] px-4 py-12 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-lg items-center">
        <div className="w-full rounded-3xl border border-emerald-400/20 bg-[#07131b]/95 p-8 shadow-2xl shadow-emerald-500/5 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Operations backend</p>
              <h1 className="text-2xl font-bold text-white">Profit Pilot AI Ops Access</h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-400">
            Enter the ops token or owner email to unlock the hidden backend console. This protects the operational pages and API routes from public access.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="grid gap-2 text-sm font-medium text-slate-200">
              Ops access
              <input
                value={token}
                onChange={(event) => setToken(event.target.value)}
                type="password"
                autoComplete="off"
                className="rounded-xl border border-emerald-400/20 bg-[#03080d] px-4 py-3 text-white outline-none transition focus:border-emerald-300"
                placeholder="Enter ops token or owner email"
              />
            </label>

            {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 font-bold text-[#02120f] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Unlock ops console
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-border bg-muted/50 p-4 text-xs leading-5 text-slate-400">
            Set <span className="font-mono text-emerald-300">OPS_ACCESS_TOKEN</span> or <span className="font-mono text-emerald-300">OPS_OWNER_EMAIL</span> in local env and Vercel.
            Then use this page to sign in once per browser session.
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-300 transition hover:text-emerald-200"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to public site
          </button>
        </div>
      </div>
    </div>
  );
}
