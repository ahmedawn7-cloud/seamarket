"use client";

import { ArrowRight, CheckCircle2, PlayCircle } from "lucide-react";
import WaitlistForm from "@/components/WaitlistForm";

const VIDEO_URLS = [
  "https://saxtrrxaaahextpfskuq.supabase.co/storage/v1/object/public/assets/AliExpress_to_Shopee_transition_202606200115.mp4",
  "https://saxtrrxaaahextpfskuq.supabase.co/storage/v1/object/public/assets/E%20commerce.mp4",
  "https://saxtrrxaaahextpfskuq.supabase.co/storage/v1/object/public/assets/UI_dashboard_with_sales_growth_202606200115.mp4",
];

export default function HomeView({ onExploreProducts }: { onExploreProducts?: () => void }) {
  function scrollToWaitlist() {
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-16 px-4 pb-20">
      <section className="flex flex-col items-center justify-center gap-6 pt-8 text-center">
        <img src="/profit-pilot-logo.png" alt="Profit Pilot AI" className="h-32 w-auto object-contain md:h-44" />

        <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">
          Southeast Asia product intelligence
        </div>

        <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-white md:text-5xl">
          Stop guessing what sells. <span className="text-cyan-300">Start knowing.</span>
        </h1>

        <p className="mx-auto max-w-2xl text-base leading-7 text-slate-400">
          Profit Pilot AI helps sellers spot rising products, compare marketplaces, and turn messy Shopee, Lazada, and TikTok Shop signals into clear action.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onExploreProducts}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            Explore live products <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => document.getElementById("demo-videos")?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 bg-white/5 px-6 py-3 font-bold text-slate-200 transition hover:border-cyan-400"
          >
            Watch the demo <PlayCircle className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section id="demo-videos" className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        {VIDEO_URLS.map((url) => (
          <div key={url} className="h-48 overflow-hidden rounded-xl border border-slate-800 bg-black shadow-xl transition hover:border-cyan-400/50">
            <video autoPlay loop muted playsInline preload="metadata" className="h-full w-full object-cover">
              <source src={url} type="video/mp4" />
            </video>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-white">Choose your product edge</h2>
          <p className="mt-2 text-sm text-slate-400">Start with market visibility. Upgrade when the data starts paying for itself.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { title: "Free Guest", price: "$0", perks: ["Top product previews", "Basic market articles", "Read-only access"] },
            { title: "Registered", price: "$0", perks: ["Save your first product", "Basic analytics", "Community access"] },
            { title: "Pro", price: "$9/mo", perks: ["Full AI analytics", "Sourcing intelligence", "Custom tracking alerts"], featured: true },
          ].map((tier) => (
            <div
              key={tier.title}
              className={`rounded-xl border p-7 text-left transition ${
                tier.featured
                  ? "border-cyan-400/50 bg-[#0d1b2a] shadow-lg shadow-cyan-500/10"
                  : "border-slate-800 bg-[#0d1322] hover:border-slate-600"
              }`}
            >
              {tier.featured && (
                <span className="mb-4 inline-block rounded-full bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-200">
                  Most popular
                </span>
              )}
              <h3 className="text-xl font-bold text-white">{tier.title}</h3>
              <p className="my-5 text-4xl font-bold text-cyan-300">{tier.price}</p>
              <ul className="mb-7 space-y-3 text-sm text-slate-400">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    {perk}
                  </li>
                ))}
              </ul>
              <button
                onClick={scrollToWaitlist}
                className="w-full rounded-lg border border-slate-700 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:border-cyan-400 hover:bg-cyan-400/10"
              >
                Register interest
              </button>
            </div>
          ))}
        </div>
      </section>

      <section id="waitlist" className="mx-auto max-w-5xl scroll-mt-24 border-t border-slate-800/80 pt-16">
        <WaitlistForm />
      </section>
    </div>
  );
}