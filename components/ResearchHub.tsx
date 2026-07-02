"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Bot, Bookmark, Calculator, CalendarDays, Edit3, MessageSquare, Scale, Send, Target, TrendingUp } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function ResearchHub() {
  const [buyCost, setBuyCost] = useState(18);
  const [sellPrice, setSellPrice] = useState(39);
  const [shipping, setShipping] = useState(4);
  const [platformFee, setPlatformFee] = useState(8);
  const [chatInput, setChatInput] = useState("");
  const [notes, setNotes] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Ask me what to research: margin, supplier risk, competition, product positioning, or what to check before sourcing.",
    },
  ]);

  const result = useMemo(() => {
    const fee = sellPrice * (platformFee / 100);
    const profit = sellPrice - buyCost - shipping - fee;
    const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
    return { fee, profit, margin };
  }, [buyCost, sellPrice, shipping, platformFee]);

  function sendMessage() {
    const text = chatInput.trim();
    if (!text) return;

    setMessages((current) => [
      ...current,
      { role: "user", text },
      {
        role: "assistant",
        text: "Research path: check sales velocity, review quality, supplier cost, shipping speed, and whether the product has a clear video demonstration angle. API-powered AI can be connected here later.",
      },
    ]);
    setChatInput("");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Research Hub</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Chat, compare, calculate margins, and build your product thesis before deciding what to source.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 flex flex-col h-[500px]">
          <div className="mb-4 flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">ProfitPilot AI</h2>
              <p className="text-xs text-slate-500">Always ready to research</p>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-2 pr-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`inline-block max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-cyan-500 text-slate-950 rounded-br-none"
                      : "border border-slate-800 bg-[#111827] text-slate-300 rounded-tl-none"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2 pt-2">
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") sendMessage();
              }}
              placeholder="Ask about a product or niche..."
              className="min-w-0 flex-1 rounded-full border border-slate-700 bg-black/40 px-5 py-3 text-sm text-white outline-none focus:border-cyan-400 transition"
            />
            <button onClick={sendMessage} className="flex items-center justify-center rounded-full bg-cyan-500 p-3 text-slate-950 transition hover:bg-cyan-300">
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 h-full flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit3 className="h-5 w-5 text-cyan-300" />
                <h2 className="text-lg font-bold text-white">Research Notes & Docs</h2>
              </div>
              <button className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition">Save Notes</button>
            </div>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jot down your product thesis, supplier links, and cost estimates here..."
              className="w-full flex-1 resize-none rounded-lg border border-slate-800 bg-[#070b16] p-4 text-sm leading-6 text-slate-300 outline-none focus:border-cyan-400/50 transition"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6">
          <div className="mb-5 flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-amber-300" />
            <h2 className="text-xl font-bold text-white">Seasonality Calendar</h2>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"].map((q, idx) => (
              <div key={q} className={`rounded-lg border border-slate-800 p-3 text-center ${idx === 2 ? "bg-amber-500/10 border-amber-500/30" : "bg-black/20"}`}>
                <p className={`text-xs font-bold ${idx === 2 ? "text-amber-300" : "text-slate-400"}`}>{q}</p>
                <div className="mt-2 space-y-1">
                  <div className={`h-1.5 w-full rounded-full ${idx === 2 ? "bg-amber-400" : "bg-slate-700"}`}></div>
                  <div className={`h-1.5 w-3/4 mx-auto rounded-full ${idx === 2 ? "bg-amber-400/50" : "bg-slate-700/50"}`}></div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-400">
            <strong>Insight:</strong> Peak demand for Sports & Outdoors occurs in Q3. Consider ramping up inventory by late June.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6">
          <div className="mb-5 flex items-center gap-3">
            <Target className="h-5 w-5 text-indigo-300" />
            <h2 className="text-xl font-bold text-white">Target Audience Insights</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-sm text-slate-400">Demographic</span>
              <span className="text-sm font-medium text-white">Males, 18-34 (62%)</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-sm text-slate-400">Primary Geo</span>
              <span className="text-sm font-medium text-white">Kuala Lumpur, Selangor</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-sm text-slate-400">Interests</span>
              <span className="text-sm font-medium text-white">Gym, Crossfit, Running</span>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-400">
            <strong>Hook Idea:</strong> "Stop hurting your back during deadlifts..."
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6">
          <div className="mb-5 flex items-center gap-3">
            <Calculator className="h-5 w-5 text-emerald-300" />
            <h2 className="text-xl font-bold text-white">Quick margin calculator</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <NumberInput label="Source cost" value={buyCost} onChange={setBuyCost} />
            <NumberInput label="Sell price" value={sellPrice} onChange={setSellPrice} />
            <NumberInput label="Shipping cost" value={shipping} onChange={setShipping} />
            <NumberInput label="Platform fee %" value={platformFee} onChange={setPlatformFee} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6">
          <h2 className="text-xl font-bold text-white">Estimated result</h2>
          <div className="mt-6 space-y-4">
            <Metric label="Platform fee" value={`RM ${result.fee.toFixed(2)}`} />
            <Metric label="Profit per unit" value={`RM ${result.profit.toFixed(2)}`} highlight={result.profit >= 0 ? "text-emerald-300" : "text-red-300"} />
            <Metric label="Margin" value={`${result.margin.toFixed(1)}%`} highlight={result.margin >= 25 ? "text-emerald-300" : "text-amber-300"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      {label}
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-lg border border-slate-700 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-400 transition"
      />
    </label>
  );
}

function Metric({ label, value, highlight = "text-white" }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-black/20 px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`font-bold ${highlight}`}>{value}</span>
    </div>
  );
}