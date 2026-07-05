"use client";

import { useState, useEffect } from "react";
import { Play, Activity, Server, Search, Download, Calendar, Plus, Trash2 } from "lucide-react";

export default function ScraperDashboard() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  
  // Manual trigger state
  const [platform, setPlatform] = useState("Shopee");
  const [limit, setLimit] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [runGate, setRunGate] = useState<any>(null);

  // Schedule creation state
  const [schedPlatform, setSchedPlatform] = useState("Shopee");
  const [schedFrequency, setSchedFrequency] = useState("weekly");
  const [schedDay, setSchedDay] = useState("Monday");
  const [schedLimit, setSchedLimit] = useState(100);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/internal/scraper/status", {
        headers: { Authorization: "Bearer default_dev_secret" },
      });
      const data = await res.json();
      if (data.runs) setLogs(data.runs);
    } catch (e) {
      console.error("Failed to fetch logs", e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/internal/scraper/latest", {
        headers: { Authorization: "Bearer default_dev_secret" },
      });
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (e) {
      console.error("Failed to fetch products", e);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await fetch("/api/internal/scraper/schedules/list", {
        headers: { Authorization: "Bearer default_dev_secret" },
      });
      const data = await res.json();
      if (data.schedules) setSchedules(data.schedules);
    } catch (e) {
      console.error("Failed to fetch schedules", e);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchProducts();
    fetchSchedules();
    fetch("/api/ops/health", { cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => setRunGate(payload.botReadiness?.find((bot: any) => bot.bot === "scraper") || null))
      .catch(() => setRunGate({ ready: false, status: "api_failing" }));
  }, []);

  const runScraper = async () => {
    if (!runGate?.ready) {
      setStatusMsg(getRunGateMessage(runGate));
      return;
    }
    setRunning(true);
    setStatusMsg(`Starting ${platform} scraper (Demo Mode)...`);
    try {
      const res = await fetch("/api/internal/scraper/run", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: "Bearer default_dev_secret" 
        },
        body: JSON.stringify({ platform, limit }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`Success! Found: ${data.found}, Saved: ${data.saved}, Failed: ${data.failed}`);
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

  const createSchedule = async () => {
    if (!runGate?.ready) {
      setStatusMsg(getRunGateMessage(runGate));
      return;
    }
    try {
      await fetch("/api/internal/scraper/schedules/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: "Bearer default_dev_secret" 
        },
        body: JSON.stringify({ 
          platform: schedPlatform, 
          frequency: schedFrequency, 
          day_of_week: schedFrequency === "weekly" ? schedDay : undefined,
          max_products: schedLimit
        }),
      });
      fetchSchedules();
    } catch (e) {
      console.error("Failed to create schedule", e);
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm("Delete schedule?")) return;
    try {
      await fetch("/api/internal/scraper/schedules/delete", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: "Bearer default_dev_secret" 
        },
        body: JSON.stringify({ id }),
      });
      fetchSchedules();
    } catch (e) {
      console.error("Failed to delete schedule", e);
    }
  };

  const toggleSchedule = async (id: string, enabled: boolean) => {
    try {
      await fetch("/api/internal/scraper/schedules/update", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: "Bearer default_dev_secret" 
        },
        body: JSON.stringify({ id, enabled: !enabled }),
      });
      fetchSchedules();
    } catch (e) {
      console.error("Failed to toggle schedule", e);
    }
  };

  const filteredProducts = products.filter(p => 
    p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 ops-shell min-h-screen text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cyan-300 flex items-center gap-2">
            <Server className="h-6 w-6" /> Scraper Bot Controller
          </h1>
          <p className="text-muted-foreground mt-2">Manage marketplace adapters, schedules, and trigger manual runs.</p>
          <p className="text-xs text-amber-400 mt-1 px-2 py-1 bg-amber-400/10 rounded inline-block">Demo adapter data — real marketplace connection not active yet</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="bg-card border border-border p-6 rounded-xl space-y-4">
          <h2 className="text-xl font-bold">Manual Trigger</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-muted-foreground block mb-2">Platform</label>
              <select 
                value={platform} 
                onChange={e => setPlatform(e.target.value)}
                className="w-full bg-input border border-border rounded-lg p-2 focus:border-cyan-400 outline-none"
              >
                <option value="Shopee">Shopee</option>
                <option value="Lazada">Lazada</option>
                <option value="TikTok Shop">TikTok Shop</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-muted-foreground block mb-2">Limit</label>
              <input 
                type="number" 
                value={limit} 
                onChange={e => setLimit(parseInt(e.target.value))}
                className="w-full bg-input border border-border rounded-lg p-2 focus:border-cyan-400 outline-none"
              />
            </div>
          </div>

          <button 
            onClick={runScraper}
            disabled={running || !runGate?.ready}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {running ? <Activity className="animate-spin h-5 w-5" /> : <Play className="h-5 w-5" />}
            {running ? "Running Scraper..." : "Run Scraper Now"}
          </button>
          {!runGate?.ready && (
            <p className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-300">
              {getRunGateMessage(runGate)}
            </p>
          )}
          
          {statusMsg && (
            <div className="p-3 bg-muted rounded-lg border border-border text-sm">
              {statusMsg}
            </div>
          )}
        </div>

        {/* Create Schedule */}
        <div className="bg-card border border-border p-6 rounded-xl space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-cyan-300" /> Add Schedule
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-muted-foreground block mb-2">Platform</label>
              <select 
                value={schedPlatform} 
                onChange={e => setSchedPlatform(e.target.value)}
                className="w-full bg-input border border-border rounded-lg p-2 focus:border-cyan-400 outline-none"
              >
                <option value="Shopee">Shopee</option>
                <option value="Lazada">Lazada</option>
                <option value="TikTok Shop">TikTok Shop</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-muted-foreground block mb-2">Frequency</label>
              <select 
                value={schedFrequency} 
                onChange={e => setSchedFrequency(e.target.value)}
                className="w-full bg-input border border-border rounded-lg p-2 focus:border-cyan-400 outline-none"
              >
                <option value="weekly">Weekly</option>
                <option value="one_time">One Time</option>
              </select>
            </div>
          </div>

          {schedFrequency === "weekly" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-muted-foreground block mb-2">Day</label>
                <select 
                  value={schedDay} 
                  onChange={e => setSchedDay(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg p-2 focus:border-cyan-400 outline-none"
                >
                  {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-muted-foreground block mb-2">Limit</label>
                <input 
                  type="number" 
                  value={schedLimit} 
                  onChange={e => setSchedLimit(parseInt(e.target.value))}
                  className="w-full bg-input border border-border rounded-lg p-2 focus:border-cyan-400 outline-none"
                />
              </div>
            </div>
          )}

          <button 
            onClick={createSchedule}
            disabled={!runGate?.ready}
            className="w-full bg-surface-soft hover:bg-surface-elevated text-cyan-300 border border-border font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Create Schedule
          </button>
        </div>
      </div>

      {/* Existing Schedules */}
      <div className="bg-card border border-border p-6 rounded-xl space-y-4">
        <h2 className="text-xl font-bold">Existing Schedules</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 font-bold rounded-tl-lg">Platform</th>
                <th className="p-3 font-bold">Frequency</th>
                <th className="p-3 font-bold">Next Run</th>
                <th className="p-3 font-bold">Status</th>
                <th className="p-3 font-bold rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {schedules.map((s, i) => (
                <tr key={s.id || i} className="hover:bg-muted/50 transition">
                  <td className="p-3 font-medium">{s.platform}</td>
                  <td className="p-3 capitalize">{s.frequency} {s.frequency === "weekly" ? `(${s.day_of_week})` : ""}</td>
                  <td className="p-3">{s.next_run_at ? new Date(s.next_run_at).toLocaleString() : "N/A"}</td>
                  <td className="p-3">
                    <button 
                      onClick={() => toggleSchedule(s.id, s.enabled)}
                      className={`px-2 py-1 rounded text-xs font-bold ${s.enabled ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}
                    >
                      {s.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </td>
                  <td className="p-3 flex items-center gap-2">
                    <button onClick={() => deleteSchedule(s.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {schedules.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    No schedules found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Products */}
      <div className="bg-card border border-border p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent Scraped Products</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:border-cyan-400 outline-none"
              />
            </div>
            <button className="bg-muted border border-border p-2 rounded-lg hover:border-cyan-400 transition" title="CSV Export (TODO)">
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 font-bold rounded-tl-lg">Platform</th>
                <th className="p-3 font-bold">Product Name</th>
                <th className="p-3 font-bold">Price</th>
                <th className="p-3 font-bold">Sales</th>
                <th className="p-3 font-bold rounded-tr-lg">Scraped Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((p, i) => (
                <tr key={p.id || i} className="hover:bg-muted/50 transition">
                  <td className="p-3">
                    <span className="px-2 py-1 bg-cyan-400/10 text-cyan-300 rounded text-xs font-bold">
                      {p.platform}
                    </span>
                  </td>
                  <td className="p-3">
                    <p className="font-medium line-clamp-1 max-w-xs" title={p.product_name}>
                      {p.product_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">AI Clean: {p.clean_name_ai}</p>
                  </td>
                  <td className="p-3 font-bold">RM {p.price_rm}</td>
                  <td className="p-3">{p.sales}</td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(p.scrape_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    No products found in the database.
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

function getRunGateMessage(gate: any) {
  if (!gate) return "API failing: readiness check is still loading or unavailable.";
  if (gate.status === "missing_environment_variable") return `Missing environment variable: ${gate.missingEnv?.join(", ") || "required bot secret"}.`;
  if (gate.status === "missing_table_or_column") return `Missing table/column: ${gate.missingTables?.join(", ") || "required bot schema"}.`;
  if (gate.status === "demo_adapter_only") return "Demo adapter data — real marketplace connection not active yet.";
  return "API failing: bot is not ready to run.";
}
