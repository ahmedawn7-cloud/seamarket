"use client";

import { useState, useEffect, useMemo } from "react";
import { Play, Activity, Settings2, Search, AlertTriangle, CheckCircle2, XCircle, Copy } from "lucide-react";

export default function CleanerDashboard() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Manual trigger state
  const [limit, setLimit] = useState(100);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [filterDuplicate, setFilterDuplicate] = useState("all");
  const [filterValid, setFilterValid] = useState("all");

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/internal/cleaner/status", {
        headers: { Authorization: "Bearer default_dev_secret" },
      });
      const data = await res.json();
      if (data.runs) setLogs(data.runs);
    } catch (e) {
      console.error("Failed to fetch cleaner logs", e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/internal/cleaner/latest?limit=200", {
        headers: { Authorization: "Bearer default_dev_secret" },
      });
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (e) {
      console.error("Failed to fetch cleaned products", e);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchProducts();
  }, []);

  const runCleaner = async () => {
    setRunning(true);
    setStatusMsg(`Starting Cleaner Bot (Limit: ${limit})...`);
    try {
      const res = await fetch("/api/internal/cleaner/run", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: "Bearer default_dev_secret" 
        },
        body: JSON.stringify({ limit }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`Success! Processed: ${data.processed}, Cleaned: ${data.cleaned}, Duplicates: ${data.duplicates}, Invalid: ${data.invalid}`);
      } else {
        setStatusMsg(`Error: ${data.error}`);
      }
      fetchStatus();
      fetchProducts();
    } catch (e: any) {
      setStatusMsg(`Exception: ${e.message}`);
    }
    setRunning(false);
  };

  const lastRun = logs.length > 0 ? logs[0] : null;

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.original_product_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.clean_name_ai?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.internal_product_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDup = filterDuplicate === "all" ? true :
                         filterDuplicate === "yes" ? p.is_duplicate === true :
                         p.is_duplicate === false;
                         
      const matchesValid = filterValid === "all" ? true : p.validation_status === filterValid;

      return matchesSearch && matchesDup && matchesValid;
    });
  }, [products, searchTerm, filterDuplicate, filterValid]);

  const avgConfidence = products.length > 0 
    ? Math.round(products.reduce((acc, p) => acc + (p.confidence_score || 0), 0) / products.length)
    : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 ops-shell min-h-screen text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-emerald-400 flex items-center gap-2">
            <Settings2 className="h-6 w-6" /> Data Cleaner Bot
          </h1>
          <p className="text-muted-foreground mt-2">Normalize, validate, deduplicate, and score scraped marketplace data.</p>
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
                max={500}
                onChange={e => setLimit(parseInt(e.target.value))}
                className="w-full bg-input border border-border rounded-lg p-2 focus:border-emerald-400 outline-none"
              />
              <p className="text-xs text-muted-foreground mt-2">Max 500 records per manual run to prevent timeouts.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <button 
              onClick={runCleaner}
              disabled={running}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {running ? <Activity className="animate-spin h-5 w-5" /> : <Play className="h-5 w-5" />}
              {running ? "Running Cleaner..." : "Run Cleaner Now"}
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
                  <p className="text-sm text-muted-foreground font-bold">Processed</p>
                  <p className="text-xl font-bold mt-1 text-foreground">{lastRun.products_found}</p>
               </div>
               <div className="bg-input p-4 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground font-bold">Cleaned</p>
                  <p className="text-xl font-bold mt-1 text-cyan-400">{lastRun.products_cleaned}</p>
               </div>
               <div className="bg-input p-4 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground font-bold">Duplicates</p>
                  <p className="text-xl font-bold mt-1 text-amber-400">{lastRun.products_duplicate}</p>
               </div>
            </div>
          ) : (
            <p className="text-muted-foreground mt-4">No recent runs found.</p>
          )}

          <h2 className="text-xl font-bold mt-6 pt-4 border-t border-border">Global DB Stats (Preview Sample)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
             <div className="bg-input p-4 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground font-bold">Total preview</p>
                <p className="text-xl font-bold mt-1 text-foreground">{products.length}</p>
             </div>
             <div className="bg-input p-4 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground font-bold">Avg Confidence</p>
                <p className={`text-xl font-bold mt-1 ${avgConfidence > 80 ? 'text-emerald-400' : avgConfidence > 50 ? 'text-amber-400' : 'text-red-400'}`}>
                  {avgConfidence}%
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Recent Cleaned Products */}
      <div className="bg-card border border-border p-6 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Cleaned Products Data</h2>
          <div className="flex flex-wrap gap-2">
            <select 
              value={filterDuplicate} 
              onChange={e => setFilterDuplicate(e.target.value)}
              className="bg-input border border-border rounded-lg px-3 py-2 text-sm focus:border-emerald-400 outline-none"
            >
              <option value="all">All Duplicates</option>
              <option value="no">Unique Only</option>
              <option value="yes">Duplicates Only</option>
            </select>
            <select 
              value={filterValid} 
              onChange={e => setFilterValid(e.target.value)}
              className="bg-input border border-border rounded-lg px-3 py-2 text-sm focus:border-emerald-400 outline-none"
            >
              <option value="all">All Status</option>
              <option value="valid">Valid</option>
              <option value="warning">Warning</option>
              <option value="invalid">Invalid</option>
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search clean name..." 
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
                <th className="p-3 font-bold rounded-tl-lg">ID & Score</th>
                <th className="p-3 font-bold">Clean Name</th>
                <th className="p-3 font-bold">Normalization</th>
                <th className="p-3 font-bold">Status</th>
                <th className="p-3 font-bold rounded-tr-lg">Cleaned Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((p, i) => (
                <tr key={p.id || i} className="hover:bg-muted/50 transition">
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-xs text-cyan-300 flex items-center gap-1">
                        {p.internal_product_id}
                        <button title="Copy ID" onClick={() => navigator.clipboard.writeText(p.internal_product_id)}>
                          <Copy className="h-3 w-3 text-muted-foreground hover:text-cyan-300" />
                        </button>
                      </span>
                      <span className={`px-2 py-0.5 w-max rounded text-xs font-bold ${
                        p.confidence_score > 80 ? 'bg-emerald-400/10 text-emerald-400' :
                        p.confidence_score > 50 ? 'bg-amber-400/10 text-amber-400' :
                        'bg-red-400/10 text-red-400'
                      }`}>
                        Score: {p.confidence_score}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="font-bold text-emerald-300 line-clamp-1 max-w-[200px]" title={p.clean_name_ai}>
                      {p.clean_name_ai}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px] line-through mt-1" title={p.original_product_name}>
                      {p.original_product_name}
                    </p>
                    <div className="flex gap-1 mt-1 flex-wrap max-w-[200px]">
                       {p.keywords?.slice(0,3).map((k: string) => (
                         <span key={k} className="text-[10px] bg-muted px-1 rounded text-muted-foreground">{k}</span>
                       ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="text-xs"><span className="text-muted-foreground">Brand:</span> {p.normalized_brand || "N/A"}</p>
                    <p className="text-xs mt-1"><span className="text-muted-foreground">Cat:</span> {p.normalized_category}</p>
                    <p className="text-xs mt-1"><span className="text-muted-foreground">Lang:</span> <span className="capitalize">{p.language}</span></p>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      {p.validation_status === "valid" && <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="h-3 w-3"/> Valid</span>}
                      {p.validation_status === "warning" && <span className="flex items-center gap-1 text-xs text-amber-400"><AlertTriangle className="h-3 w-3"/> Warning</span>}
                      {p.validation_status === "invalid" && <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="h-3 w-3"/> Invalid</span>}
                      
                      {p.is_duplicate && (
                        <span className="text-[10px] bg-amber-400/10 text-amber-400 px-1 rounded border border-amber-400/20 w-max mt-1" title={`Group: ${p.duplicate_group}`}>
                          Duplicate
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {new Date(p.cleaned_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    No clean products found. Run the cleaner to populate this table.
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
