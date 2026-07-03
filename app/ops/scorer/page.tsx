"use client";

import { useState, useEffect, useMemo } from "react";
import { Play, Activity, Target, Search, AlertTriangle, TrendingUp } from "lucide-react";

export default function ScorerDashboard() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [scoreData, setScoreData] = useState<any[]>([]);
  
  // Controls
  const [limit, setLimit] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  
  // Filters
  const [filterRec, setFilterRec] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/internal/scorer/status", {
        headers: { Authorization: "Bearer default_dev_secret" },
      });
      const data = await res.json();
      if (data.runs) setLogs(data.runs);
    } catch (e) {
      console.error("Failed to fetch scorer logs", e);
    }
  };

  const fetchScores = async () => {
    try {
      const res = await fetch("/api/internal/scorer/latest?limit=100", {
        headers: { Authorization: "Bearer default_dev_secret" },
      });
      const data = await res.json();
      if (data.scores) setScoreData(data.scores);
    } catch (e) {
      console.error("Failed to fetch score data", e);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchScores();
  }, []);

  const runScorer = async () => {
    setRunning(true);
    setStatusMsg(`Starting Scoring Bot (Limit: ${limit})...`);
    try {
      const res = await fetch("/api/internal/scorer/run", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: "Bearer default_dev_secret" 
        },
        body: JSON.stringify({ limit }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`Success! Scored: ${data.scored}. (Source Now: ${data.source_now_count}, Avoid: ${data.avoid_count})`);
      } else {
        setStatusMsg(`Error: ${data.error}`);
      }
      fetchStatus();
      fetchScores();
    } catch (e: any) {
      setStatusMsg(`Exception: ${e.message}`);
    }
    setRunning(false);
  };

  const lastRun = logs.length > 0 ? logs[0] : null;

  const filteredData = useMemo(() => {
    return scoreData.filter(r => {
      const matchesSearch = r.cleaned_products?.clean_name_ai?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            r.internal_product_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRec = filterRec === "all" ? true : r.final_recommendation === filterRec;
      
      let matchesRisk = true;
      if (filterRisk === "high") matchesRisk = r.risk_score >= 70;
      if (filterRisk === "medium") matchesRisk = r.risk_score >= 40 && r.risk_score < 70;
      if (filterRisk === "low") matchesRisk = r.risk_score < 40;

      return matchesSearch && matchesRec && matchesRisk;
    });
  }, [scoreData, searchTerm, filterRec, filterRisk]);

  const avgAiScore = scoreData.length > 0 
    ? Math.round(scoreData.reduce((acc, curr) => acc + (curr.ai_score || 0), 0) / scoreData.length) 
    : 0;

  const avgOppScore = scoreData.length > 0 
    ? Math.round(scoreData.reduce((acc, curr) => acc + (curr.opportunity_score || 0), 0) / scoreData.length) 
    : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 ops-shell min-h-screen text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-emerald-400 flex items-center gap-2">
            <Target className="h-6 w-6" /> Product Scoring Bot
          </h1>
          <p className="text-muted-foreground mt-2">Turning clean data and deep research into business decisions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="bg-card border border-border p-6 rounded-xl space-y-4 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold">Manual Trigger</h2>
            <div className="mt-4">
              <label className="text-sm font-bold text-muted-foreground block mb-2">Batch Limit</label>
              <input 
                type="number" 
                value={limit} 
                max={200}
                onChange={e => setLimit(parseInt(e.target.value))}
                className="w-full bg-input border border-border rounded-lg p-2 focus:border-emerald-400 outline-none"
              />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <button 
              onClick={runScorer}
              disabled={running}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {running ? <Activity className="animate-spin h-5 w-5" /> : <Play className="h-5 w-5" />}
              {running ? "Scoring..." : "Run Scorer Now"}
            </button>
            
            {statusMsg && (
              <div className="p-3 bg-muted rounded-lg border border-border text-sm break-words">
                {statusMsg}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-card border border-border p-6 rounded-xl space-y-4 lg:col-span-2">
          <h2 className="text-xl font-bold">Latest Run Status</h2>
          {lastRun ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
               <div className="bg-input p-4 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground font-bold">Status</p>
                  <p className={`text-xl font-bold mt-1 ${lastRun.status === 'success' ? 'text-emerald-400' : lastRun.status === 'partial' ? 'text-amber-400' : 'text-red-400'}`}>
                    {lastRun.status.toUpperCase()}
                  </p>
               </div>
               <div className="bg-input p-4 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground font-bold">Scored</p>
                  <p className="text-xl font-bold mt-1 text-foreground">{lastRun.products_scored}</p>
               </div>
               <div className="bg-input p-4 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground font-bold">Source Now</p>
                  <p className="text-xl font-bold mt-1 text-emerald-400">{lastRun.source_now_count}</p>
               </div>
               <div className="bg-input p-4 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground font-bold">Avoid</p>
                  <p className="text-xl font-bold mt-1 text-red-400">{lastRun.avoid_count}</p>
               </div>
            </div>
          ) : (
            <p className="text-muted-foreground mt-4">No recent runs found.</p>
          )}

          <h2 className="text-xl font-bold mt-6 pt-4 border-t border-border">Global Database Averages (Preview)</h2>
          <div className="grid grid-cols-2 gap-4 mt-4">
             <div className="bg-input p-4 rounded-lg border border-border flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400"><Target className="h-6 w-6"/></div>
                <div>
                  <p className="text-sm text-muted-foreground font-bold">Average AI Score</p>
                  <p className="text-2xl font-bold mt-1 text-foreground">{avgAiScore}/100</p>
                </div>
             </div>
             <div className="bg-input p-4 rounded-lg border border-border flex items-center gap-4">
                <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400"><TrendingUp className="h-6 w-6"/></div>
                <div>
                  <p className="text-sm text-muted-foreground font-bold">Average Opportunity Score</p>
                  <p className="text-2xl font-bold mt-1 text-foreground">{avgOppScore}/100</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Recent Scored Products */}
      <div className="bg-card border border-border p-6 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Decisions & Scores</h2>
          <div className="flex flex-wrap gap-2">
            <select 
              value={filterRec} 
              onChange={e => setFilterRec(e.target.value)}
              className="bg-input border border-border rounded-lg px-3 py-2 text-sm focus:border-emerald-400 outline-none"
            >
              <option value="all">All Recommendations</option>
              <option value="source_now">Source Now</option>
              <option value="watch">Watch</option>
              <option value="research_more">Research More</option>
              <option value="avoid">Avoid</option>
            </select>
            <select 
              value={filterRisk} 
              onChange={e => setFilterRisk(e.target.value)}
              className="bg-input border border-border rounded-lg px-3 py-2 text-sm focus:border-emerald-400 outline-none"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk (&lt;40)</option>
              <option value="medium">Medium Risk (40-69)</option>
              <option value="high">High Risk (70+)</option>
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:border-emerald-400 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 font-bold rounded-tl-lg">Product</th>
                <th className="p-3 font-bold">Recommendation</th>
                <th className="p-3 font-bold">Scores (Out of 100)</th>
                <th className="p-3 font-bold">Risk & Confidence</th>
                <th className="p-3 font-bold rounded-tr-lg">Scoring Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.map((r, i) => (
                <tr key={r.id || i} className="hover:bg-muted/50 transition">
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-xs text-cyan-300">
                        {r.internal_product_id}
                      </span>
                      <p className="font-bold text-foreground line-clamp-2 max-w-[200px]" title={r.cleaned_products?.clean_name_ai}>
                        {r.cleaned_products?.clean_name_ai}
                      </p>
                      <span className="text-[10px] text-muted-foreground">{r.cleaned_products?.normalized_category}</span>
                    </div>
                  </td>
                  <td className="p-3">
                     <span className={`px-2 py-1 w-max rounded font-bold flex items-center gap-1 ${
                        r.final_recommendation === 'source_now' ? 'bg-emerald-400/10 text-emerald-400' :
                        r.final_recommendation === 'watch' ? 'bg-cyan-400/10 text-cyan-400' :
                        r.final_recommendation === 'research_more' ? 'bg-amber-400/10 text-amber-400' :
                        'bg-red-400/10 text-red-400'
                      }`}>
                        {r.final_recommendation?.toUpperCase().replace('_', ' ')}
                      </span>
                  </td>
                  <td className="p-3">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div className="flex justify-between w-32"><span className="text-muted-foreground">AI:</span> <span className="font-bold text-emerald-400">{r.ai_score}</span></div>
                      <div className="flex justify-between w-32"><span className="text-muted-foreground">Opp:</span> <span className="font-bold">{r.opportunity_score}</span></div>
                      <div className="flex justify-between w-32"><span className="text-muted-foreground">Profit:</span> <span className="font-bold text-cyan-400">{r.profit_score}</span></div>
                      <div className="flex justify-between w-32"><span className="text-muted-foreground">Demand:</span> <span className="font-bold text-blue-400">{r.demand_score}</span></div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1 text-xs font-mono">
                      <span className={r.risk_score >= 70 ? 'text-red-400 font-bold' : 'text-muted-foreground'}>Risk: {r.risk_score}</span>
                      <span className={r.regulatory_score <= 30 ? 'text-red-400 font-bold' : 'text-muted-foreground'}>Reg: {r.regulatory_score}</span>
                      {r.confidence_score < 60 && <span className="text-amber-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> Conf: {r.confidence_score}</span>}
                    </div>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground max-w-[250px]">
                    <ul className="list-disc pl-3 space-y-1">
                      {r.scoring_notes?.slice(0, 3).map((note: string, idx: number) => (
                        <li key={idx} className="line-clamp-1" title={note}>{note}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    No scores found. Run the Scoring Bot to populate this table.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
