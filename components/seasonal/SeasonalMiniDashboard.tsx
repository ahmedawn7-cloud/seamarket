"use client";

import { useMemo } from "react";
import { CalendarDays, AlertCircle } from "lucide-react";
import { getCurrentMonthEvents, getUpcomingEvents } from "@/lib/seasonal/get-current-season";
import SeasonalOpportunityCard from "./SeasonalOpportunityCard";

export default function SeasonalMiniDashboard({ onResearch }: { onResearch?: (category: string) => void }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const thisMonthEvents = useMemo(() => getCurrentMonthEvents(), []);
  const upcomingEvents = useMemo(() => getUpcomingEvents(3), []);

  const topOpportunities = useMemo(() => {
    const opps: { event: any; category: string }[] = [];
    upcomingEvents.forEach(event => {
      event.defaultCategories.slice(0, 1).forEach(category => {
        opps.push({ event, category });
      });
    });
    return opps.slice(0, 4); // Top 4 for the mini dashboard
  }, [upcomingEvents]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-cyan-500" />
          <h3 className="font-bold text-foreground">Seasonal Intelligence</h3>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {thisMonthEvents.length > 0 && (
          <div className="rounded-lg border border-blue-400/20 bg-blue-400/5 p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <p className="text-sm font-bold text-blue-400">Active This Month</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {thisMonthEvents.map(event => (
                <span key={event.id} className="rounded-full bg-card px-2 py-1 text-xs text-foreground border border-border">
                  {event.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Categories to Watch & Source Now
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {topOpportunities.map((opp, idx) => (
              <SeasonalOpportunityCard 
                key={`${opp.event.id}-${opp.category}-${idx}`}
                event={opp.event}
                category={opp.category}
                month={currentMonth}
                year={currentYear}
                onResearch={onResearch}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
