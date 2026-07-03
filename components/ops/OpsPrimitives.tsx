import { CheckCircle2 } from "lucide-react";

export function OpsHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-bold text-white">{title}</h1>
      <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

export function OpsPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 shadow-xl shadow-black/10">
      <h2 className="mb-4 text-lg font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

export function OpsMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "good" | "warn" | "bad" | "neutral";
}) {
  const toneClass =
    tone === "good" ? "text-emerald-300" : tone === "warn" ? "text-amber-300" : tone === "bad" ? "text-red-300" : "text-white";

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-3 text-2xl font-bold capitalize ${toneClass}`}>{value}</p>
    </div>
  );
}

export function StatusPill({ ok, label }: { ok: boolean; label: string }) {
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

export function OpsList({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item} className="rounded-lg border border-slate-800 bg-black/20 px-3 py-2 text-sm text-slate-300">
          {item}
        </div>
      ))}
    </div>
  );
}
