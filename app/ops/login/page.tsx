import { Suspense } from "react";
import OpsLoginClient from "@/components/ops/OpsLoginClient";

export default function OpsLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#03080d] px-4 py-12 text-white">
          <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-lg items-center">
            <div className="w-full rounded-3xl border border-emerald-400/20 bg-[#07131b]/95 p-8">
              <p className="text-sm text-slate-400">Loading ops access...</p>
            </div>
          </div>
        </div>
      }
    >
      <OpsLoginClient />
    </Suspense>
  );
}
