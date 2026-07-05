"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, ChevronDown, ChevronUp, Zap, Beaker, PackagePlus } from "lucide-react";
import { SeasonalEvent, CategoryOpportunity, TimingStatus, AIScoreDetails } from "@/lib/seasonal/seasonal-types";
import { calculateStaticSeasonalScore } from "@/lib/seasonal/seasonal-scoring";

export default function SeasonalOpportunityCard({
  event,
  category,
  month,
  year,
  onResearch
}: {
  event: SeasonalEvent;
  category: string;
  month: number;
  year: number;
  onResearch?: (category: string) => void;
}) {
  const [opportunity, setOpportunity] = useState<CategoryOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function loadPrediction() {
      setLoading(true);
      try {
        const res = await fetch("/api/seasonal/predictions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: event.id, category, year, month })
        });
        
        if (res.ok) {
          const data = await res.json();
          setOpportunity({
            eventId: event.id,
            category,
            timingStatus: data.timingStatus,
            score: data.score,
            explanation: data.explanation,
            productIdeas: data.productIdeas || [],
            isAiGenerated: data.modelUsed && !data.modelUsed.includes("static")
          });
        } else {
          // Fallback to static
          const staticData = calculateStaticSeasonalScore(event, month);
          setOpportunity({
            eventId: event.id,
            category,
            timingStatus: staticData.timingStatus,
            score: staticData.score,
            explanation: staticData.explanation,
            productIdeas: [],
            isAiGenerated: false
          });
        }
      } catch (err) {
        const staticData = calculateStaticSeasonalScore(event, month);
        setOpportunity({
          eventId: event.id,
          category,
          timingStatus: staticData.timingStatus,
          score: staticData.score,
          explanation: staticData.explanation,
          productIdeas: [],
          isAiGenerated: false
        });
      } finally {
        setLoading(false);
      }
    }
    loadPrediction();
  }, [event.id, category, year, month]);

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border border-border bg-card p-4">
        <div className="h-5 w-32 rounded bg-muted"></div>
        <div className="mt-3 h-3 w-48 rounded bg-muted/60"></div>
      </div>
    );
  }

  if (!opportunity) return null;

  function getTimingColor(status: TimingStatus) {
    switch (status) {
      case "Research now": return "text-blue-400 bg-blue-400/10 border-blue-400/30";
      case "Source now": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
      case "Launch now": return "text-green-400 bg-green-400/10 border-green-400/30";
      case "Peak demand": return "text-purple-400 bg-purple-400/10 border-purple-400/30";
      case "Too late": return "text-red-400 bg-red-400/10 border-red-400/30";
      default: return "text-slate-400 bg-slate-400/10 border-slate-400/30"; // Too early
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card transition-all hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/5">
      <div 
        className="flex cursor-pointer items-start justify-between p-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-foreground">{category}</h4>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getTimingColor(opportunity.timingStatus)}`}>
              {opportunity.timingStatus}
            </span>
            {opportunity.isAiGenerated && (
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                <Zap className="h-3 w-3" /> AI
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {event.name} • {event.approximateDate}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Opp. Score</p>
            <p className="font-bold text-foreground">{opportunity.score.opportunityScore}/100</p>
          </div>
          {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-muted/20 p-4 space-y-4">
          <p className="text-sm text-foreground">{opportunity.explanation}</p>
          
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded border border-border bg-card p-2 text-center">
              <p className="text-[10px] uppercase text-muted-foreground">Competition</p>
              <p className={`text-sm font-bold ${opportunity.score.competitionRisk > 70 ? 'text-red-400' : 'text-foreground'}`}>
                {opportunity.score.competitionRisk}/100
              </p>
            </div>
            <div className="rounded border border-border bg-card p-2 text-center">
              <p className="text-[10px] uppercase text-muted-foreground">Supplier Readiness</p>
              <p className="text-sm font-bold text-foreground">{opportunity.score.supplierReadiness}/100</p>
            </div>
            <div className="rounded border border-border bg-card p-2 text-center">
              <p className="text-[10px] uppercase text-muted-foreground">Campaign Impact</p>
              <p className="text-sm font-bold text-foreground">{opportunity.score.campaignImpact}/100</p>
            </div>
            <div className="rounded border border-border bg-card p-2 text-center">
              <p className="text-[10px] uppercase text-muted-foreground">Confidence</p>
              <p className="text-sm font-bold text-foreground">{opportunity.score.confidence}%</p>
            </div>
          </div>

          {opportunity.productIdeas.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI Product Ideas</p>
              <div className="flex flex-wrap gap-2">
                {opportunity.productIdeas.map((idea, idx) => (
                  <span key={idx} className="rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground">
                    {idea}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onResearch?.(category); }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-400 transition hover:bg-cyan-500/20"
            >
              <Beaker className="h-4 w-4" /> Research Category
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); /* TODO: Add to watchlist */ }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground hover:bg-white/5"
            >
              <PackagePlus className="h-4 w-4" /> Watchlist
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
