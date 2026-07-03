"use client";

import { useState, useEffect, useMemo } from "react";
import { Play, Activity, Microscope, Search, AlertTriangle } from "lucide-react";

export default function ResearcherDashboard() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [researchData, setResearchData] = useState<any[]>([]);
  
  // Controls
  const [limit, setLimit] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  
  // Filters
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterConfidence, setFilterConfidence] = useState("all");

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/internal/researcher/status", {
        headers: { Authorization: "Bearer default_dev_secret" },
      });
      const data = await res.json();
      if (data.runs) setLogs(data.runs);
    } catch (e) {
      console.error("Failed to fetch researcher logs", e);
    }
  };

  const fetchResearch = async () => {
    try {
      const res = await fetch("/api/internal/researcher/latest?limit=100", {
        headers: { Authorization: "Bearer default_dev_secret" },
      });
      const data = await res.json();
      if (data.research) setResearchData(data.research);
    } catch (e) {
      console.error("Failed to fetch research data", e);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchResearch();
  }, []);

  const runResearcher = async () => {
    setRunning(true);
    setStatusMsg(`Starting Research Bot (Limit: ${limit})...`);
    try {
      const res = await fetch("/api/internal/researcher/run", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: "Bearer default_dev_secret" 
        },
        body: JSON.stringify({ limit }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`Success! Researched: ${data.researched}, Suppliers: ${data.supplier_records}, Regulatory: ${data.regulatory_records}`);
      } else {
        setStatusMsg(`Error: ${data.error}`);
      }
      fetchStatus();
      fetchResearch();
    } catch (e: any) {
      setStatusMsg(`Exception: ${e.message}`);
    }
    setRunning(false);
  };

  const lastRun = logs.length > 0 ? logs[0] : null;

  const filteredData = useMemo(() => {
    return researchData.filter(r => {
      const matchesSearch = r.cleaned_products?.clean_name_ai?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            r.internal_product_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDiff = filterDifficulty === "all" ? true : r.launch_difficulty === filterDifficulty;
      const matchesConf = filterConfidence === "all" ? true : r.research_confidence === filterConfidence;

      return matchesSearch && matchesDiff && matchesConf;
    });
  }, [researchData, searchTerm, filterDifficulty, filterConfidence]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 ops-shell min-h-screen text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-emerald-400 flex items-center gap-2">
            <Microscope className="h-6 w-6" /> Product Research Bot
          </h1>
          <p className="text-muted-foreground mt-2">Generate business, supplier, and regulatory intelligence.</p>
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
              <p className="text-xs text-muted-foreground mt-2">Max 200 to avoid LLM rate limits/timeouts.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <button 
              onClick={runResearcher}
              disabled={running}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {running ? <Activity className="animate-spin h-5 w-5" /> : <Play className="h-5 w-5" />}
              {running ? "Researching..." : "Run Researcher Now"}
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
                  <p className="text-sm text-muted-foreground font-bold">Researched</p>
                  <p className="text-xl font-bold mt-1 text-foreground">{lastRun.products_researched}</p>
               </div>
               <div className="bg-input p-4 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground font-bold">Suppliers</p>
                  <p className="text-xl font-bold mt-1 text-cyan-400">{lastRun.supplier_records_created}</p>
               </div>
               <div className="bg-input p-4 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground font-bold">Regulatory</p>
                  <p className="text-xl font-bold mt-1 text-purple-400">{lastRun.regulatory_records_created}</p>
               </div>
            </div>
          ) : (
            <p className="text-muted-foreground mt-4">No recent runs found.</p>
          )}

          <h2 className="text-xl font-bold mt-6 pt-4 border-t border-border">Global DB Stats (Preview)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
             <div className="bg-input p-4 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground font-bold">Total Researched</p>
                <p className="text-xl font-bold mt-1 text-foreground">{researchData.length}</p>
             </div>
             <div className="bg-input p-4 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground font-bold">High Risk</p>
                <p className="text-xl font-bold mt-1 text-red-400">
                  {researchData.filter(r => r.regulatory_research?.sirim_risk === 'high' || r.regulatory_research?.kkm_risk === 'high' || r.regulatory_research?.npra_risk === 'high').length}
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Recent Researched Products */}
      <div className="bg-card border border-border p-6 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Researched Intelligence</h2>
          <div className="flex flex-wrap gap-2">
            <select 
              value={filterDifficulty} 
              onChange={e => setFilterDifficulty(e.target.value)}
              className="bg-input border border-border rounded-lg px-3 py-2 text-sm focus:border-emerald-400 outline-none"
            >
              <option value="all">All Launch Diff.</option>
              <option value="low">Low Diff</option>
              <option value="medium">Medium Diff</option>
              <option value="high">High Diff</option>
            </select>
            <select 
              value={filterConfidence} 
              onChange={e => setFilterConfidence(e.target.value)}
              className="bg-input border border-border rounded-lg px-3 py-2 text-sm focus:border-emerald-400 outline-none"
            >
              <option value="all">All Confidence</option>
              <option value="high">High Confidence</option>
              <option value="medium">Medium Confidence</option>
              <option value="low">Low Confidence</option>
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search..." 
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
                <th className="p-3 font-bold rounded-tl-lg">ID & Product</th>
                <th className="p-3 font-bold">Business Summary</th>
                <th className="p-3 font-bold">Launch Diff.</th>
                <th className="p-3 font-bold">Reg. Risk (MY)</th>
                <th className="p-3 font-bold rounded-tr-lg">Researched</th>
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
                    <p className="text-xs text-muted-foreground line-clamp-3 max-w-[300px]">
                      {r.product_summary}
                    </p>
                    <p className="text-[10px] font-mono mt-1 text-emerald-400">Target: {r.target_customer}</p>
                  </td>
                  <td className="p-3">
                     <span className={`px-2 py-0.5 w-max rounded text-xs font-bold ${
                        r.launch_difficulty === 'low' ? 'bg-emerald-400/10 text-emerald-400' :
                        r.launch_difficulty === 'medium' ? 'bg-amber-400/10 text-amber-400' :
                        'bg-red-400/10 text-red-400'
                      }`}>
                        {r.launch_difficulty?.toUpperCase()}
                      </span>
                      {r.research_confidence === 'low' && <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> Low Conf.</p>}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1 text-[10px] font-mono">
                      {r.regulatory_research?.kkm_risk === 'high' ? <span className="text-red-400">! KKM HIGH</span> : <span className="text-muted-foreground">KKM {r.regulatory_research?.kkm_risk}</span>}
                      {r.regulatory_research?.sirim_risk === 'high' ? <span className="text-red-400">! SIRIM HIGH</span> : <span className="text-muted-foreground">SIRIM {r.regulatory_research?.sirim_risk}</span>}
                      {r.regulatory_research?.npra_risk === 'high' ? <span className="text-red-400">! NPRA HIGH</span> : <span className="text-muted-foreground">NPRA {r.regulatory_research?.npra_risk}</span>}
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {new Date(r.researched_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    No research found. Run the Research Bot to populate this table.
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
