"use client";

import type { AccessPlan } from "@/components/AuthPanel";
import { Lock, Sparkles } from "lucide-react";

const rank: Record<AccessPlan, number> = {
  guest: 0,
  registered: 1,
  pro: 2,
};

export default function AccessGate({
  plan,
  required,
  title,
  description,
  onLogin,
  children,
}: {
  plan: AccessPlan;
  required: AccessPlan;
  title: string;
  description: string;
  onLogin: () => void;
  children: React.ReactNode;
}) {
  if (rank[plan] >= rank[required]) {
    return <>{children}</>;
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-8 text-center shadow-2xl shadow-black/20">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10">
        {required === "pro" ? <Sparkles className="h-6 w-6 text-cyan-300" /> : <Lock className="h-6 w-6 text-cyan-300" />}
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
        {required === "pro" ? "Pro access" : "Registered access"}
      </p>
      <h2 className="mt-3 text-2xl font-bold text-white">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">{description}</p>
      <button
        onClick={onLogin}
        className="mt-6 rounded-full bg-cyan-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
      >
        {plan === "guest" ? "Login / Sign Up" : "Join Pro waitlist"}
      </button>
    </div>
  );
}
