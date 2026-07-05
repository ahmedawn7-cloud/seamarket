"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Calendar, ChevronDown, Sparkles, TrendingUp } from "lucide-react";
import { getUpcomingEvents } from "@/lib/seasonal/get-current-season";
import SeasonalOpportunityCard from "./SeasonalOpportunityCard";

const trendingCategories = ["Beauty", "Modest fashion", "Home tools", "Fitness", "Plant care"];

const marketSnapshot = [
  { label: "Top gaining category", value: "Plant Care & Support", change: "From live product rows" },
  { label: "Fastest growing product", value: "Kalsium Ouli Seeds", change: "From sales field" },
  { label: "Highest ROI niche", value: "Data pending", change: "Needs ROI_Calc coverage" },
  { label: "Most searched keyword", value: "Data pending", change: "Needs search logs" },
];

export default function SeasonalSalesRadar({ onExplore }: { onExplore?: () => void }) {
  const [signalsExpanded, setSignalsExpanded] = useState(false);
  const [filterMode, setFilterMode] = useState<"30" | "90" | number>("90"); // "30", "90", or month index (1-12)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const upcomingEvents = useMemo(() => {
    if (filterMode === "30") return getUpcomingEvents(1);
    if (filterMode === "90") return getUpcomingEvents(3);
    
    // If specific month is selected
    const monthEvents = getUpcomingEvents(12).filter(e => e.month === filterMode);
    return monthEvents;
  }, [filterMode]);

  // Flatten events and categories for the highlights
  const allOpportunities = useMemo(() => {
    const opps: { event: any; category: string }[] = [];
    upcomingEvents.forEach(event => {
      event.defaultCategories.slice(0, 3).forEach(category => {
        opps.push({ event, category });
      });
    });
    return opps.slice(0, 5); // Show more opportunities now
  }, [upcomingEvents]);

  const monthsList = [
    { label: "Jan", val: 1 }, { label: "Feb", val: 2 }, { label: "Mar", val: 3 },
    { label: "Apr", val: 4 }, { label: "May", val: 5 }, { label: "Jun", val: 6 },
    { label: "Jul", val: 7 }, { label: "Aug", val: 8 }, { label: "Sep", val: 9 },
    { label: "Oct", val: 10 }, { label: "Nov", val: 11 }, { label: "Dec", val: 12 },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-2xl shadow-black/30">
      
      {/* Live Signals — compact collapsible strip */}
      <div className="mb-5 rounded-lg border border-border/60 bg-muted/20">
        {/* Always-visible header row */}
        <button
          onClick={() => setSignalsExpanded(!signalsExpanded)}
          className="flex w-full items-center gap-3 px-4 py-2.5 transition hover:bg-muted/30"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/10">
            <TrendingUp className="h-3 w-3 text-cyan-400" />
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Live Commercial Signals</span>
          <span className="ml-1 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">Live</span>
          {/* Quick inline peek — top 2 categories */}
          {!signalsExpanded && (
            <span className="ml-2 hidden truncate text-[11px] text-muted-foreground sm:block">
              ↑ {marketSnapshot[0].value} &nbsp;·&nbsp; {marketSnapshot[1].value}
            </span>
          )}
          <ChevronDown
            className={`ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${signalsExpanded ? "rotate-180" : ""}`}
          />
        </button>

        {/* Expandable detail grid */}
        {signalsExpanded && (
          <div className="border-t border-border/40 px-4 pb-4 pt-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {marketSnapshot.map((item) => (
                <div key={item.label} className="rounded-md border border-border/50 bg-card/50 px-3 py-2.5 transition hover:border-cyan-400/20">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">{item.label}</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{item.value}</p>
                  <p className="mt-0.5 text-[10px] font-bold text-cyan-400">{item.change}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">Trending:</span>
              {trendingCategories.map((category) => (
                <span key={category} className="rounded-full border border-border/50 bg-muted/40 px-2.5 py-0.5 text-[11px] text-muted-foreground transition hover:border-cyan-400/30 hover:text-cyan-300">
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Half: Seasonal Radar */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Year-Round Opportunity Calendar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
              AI predicts categories to watch based on upcoming Malaysia & global commercial events.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-1">
            <button 
              onClick={() => setFilterMode("30")}
              className={`rounded px-3 py-1.5 text-xs font-bold transition ${filterMode === "30" ? "bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
            >
              30 Days
            </button>
            <button 
              onClick={() => setFilterMode("90")}
              className={`rounded px-3 py-1.5 text-xs font-bold transition ${filterMode === "90" ? "bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
            >
              90 Days
            </button>
            <div className="h-4 w-px bg-border mx-1"></div>
            <div className="flex overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-hide flex-1 items-center gap-1">
              {monthsList.map((m) => (
                <button
                  key={m.val}
                  onClick={() => setFilterMode(m.val)}
                  className={`rounded px-2.5 py-1 text-[11px] font-bold transition whitespace-nowrap ${filterMode === m.val ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {allOpportunities.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/20 p-8 text-center">
            <Calendar className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No major commercial events in this window.</p>
          </div>
        ) : (
          allOpportunities.map((opp, idx) => (
            <SeasonalOpportunityCard 
              key={`${opp.event.id}-${opp.category}-${idx}`}
              event={opp.event}
              category={opp.category}
              month={currentMonth}
              year={currentYear}
              onResearch={onExplore}
            />
          ))
        )}
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Use seasonal intelligence to source before demand spikes.
          </p>
          <button 
            onClick={onExplore}
            className="group inline-flex items-center gap-2 rounded-full bg-white/5 border border-border px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-cyan-500/10 hover:border-cyan-400/50 hover:text-cyan-300"
          >
            Explore seasonal opportunities
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
