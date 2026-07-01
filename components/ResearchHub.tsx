"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Bot, Bookmark, Calculator, MessageSquare, Scale, Send, Target, TrendingUp } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function ResearchHub() {
  const [buyCost, setBuyCost] = useState(18);
  const [sellPrice, setSellPrice] = useState(39);
  const [shipping, setShipping] = useState(4);
  const [platformFee, setPlatformFee] = useState(8);
  const [showSaved, setShowSaved] = useState(true);
  const [savedProducts, setSavedProducts] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Ask me what to research: margin, supplier risk, competition, product positioning, or what to check before sourcing.",
    },
  ]);

  useEffect(() => {
    async function loadSaved() {
      if (!supabase) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("user_watchlist")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(12);

      setSavedProducts(data ?? []);
    }

    loadSaved();
  }, []);

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
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Research Hub</p>
        <h1 className="mt-2 text-3xl font-bold text-white">AI-assisted product research</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Chat, compare, calculate margins, and revisit saved products before deciding what to source.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5">
          <div className="mb-4 flex items-center gap-3">
            <Bot className="h-6 w-6 text-cyan-300" />
            <div>
              <h2 className="text-xl font-bold text-white">Research assistant</h2>
              <p className="text-sm text-slate-500">AI chat shell ready for future model/API integration.</p>
            </div>
          </div>

          <div className="mb-4 h-80 space-y-3 overflow-y-auto rounded-xl border border-slate-800 bg-black/20 p-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={`inline-block max-w-[85%] rounded-xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-cyan-500 text-slate-950"
                      : "border border-slate-800 bg-[#111827] text-slate-300"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") sendMessage();
              }}
              placeholder="Ask: Is this product worth sourcing?"
              className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-400"
            />
            <button onClick={sendMessage} className="rounded-lg bg-cyan-500 px-4 text-slate-950 transition hover:bg-cyan-300">
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bookmark className="h-5 w-5 text-cyan-300" />
              <h2 className="text-xl font-bold text-white">Saved research</h2>
            </div>
            <button
              onClick={() => setShowSaved((value) => !value)}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold text-slate-300 hover:border-cyan-400"
            >
              {showSaved ? "Hide" : "Show"}
            </button>
          </div>

          {showSaved && (
            <div className="space-y-3">
              {savedProducts.length > 0 ? (
                savedProducts.map((item) => {
                  const snapshot = item.snapshot || {};
                  const name = snapshot.Clean_Name_AI || snapshot.Product_Name || "Saved product";
                  return (
                    <div key={item.id} className="rounded-lg border border-slate-800 bg-black/20 p-4">
                      <p className="font-bold text-white">{name}</p>
                      <p className="mt-1 text-xs text-slate-500">Saved {new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-slate-700 p-5 text-sm leading-6 text-slate-400">
                  Saved products will appear here after users log in and save products from the analytics drawer.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Compare products", icon: Scale, text: "Line up products before choosing one." },
          { label: "Opportunity score", icon: Target, text: "Score demand, profit, and competition." },
          { label: "Trend view", icon: TrendingUp, text: "Watch momentum before it peaks." },
          { label: "Research notes", icon: MessageSquare, text: "Keep decisions tied to evidence." },
        ].map((tool) => (
          <div key={tool.label} className="rounded-xl border border-slate-800 bg-[#0d1322] p-5">
            <tool.icon className="mb-4 h-6 w-6 text-cyan-300" />
            <h3 className="font-bold text-white">{tool.label}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{tool.text}</p>
          </div>
        ))}
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
        className="rounded-lg border border-slate-700 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-400"
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