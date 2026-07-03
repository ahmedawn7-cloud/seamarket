"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { Bell, Bot, Bookmark, Calculator, CalendarDays, Edit3, FilePlus2, Send, Target, Package, ArrowRight } from "lucide-react";
import Image from "next/image";
import { sendPasarAIMessage } from "@/lib/chat/chatClient";
import type { ChatMessage } from "@/types/chat";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
type ResearchMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  createdAt: number;
};

const welcomeMessage: ResearchMessage = {
  id: "welcome",
  role: "assistant",
  text: "Ask me what to research: margin, supplier risk, competition, product positioning, or what to check before sourcing.",
  createdAt: 1,
};

export default function ResearchHub({ 
  session, 
  products = [],
  onAnalyzeProduct
}: { 
  session: Session | null; 
  products?: any[];
  onAnalyzeProduct?: (product: any) => void;
}) {
  const [buyCost, setBuyCost] = useState(18);
  const [sellPrice, setSellPrice] = useState(39);
  const [shipping, setShipping] = useState(4);
  const [platformFee, setPlatformFee] = useState(8);
  const [chatInput, setChatInput] = useState("");
  const [notes, setNotes] = useState("");
  const [savedProducts, setSavedProducts] = useState<any[]>([]);
  const [savedCommunityPosts, setSavedCommunityPosts] = useState<SavedCommunityPost[]>([]);
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [researchTasks, setResearchTasks] = useState<ResearchTask[]>([]);
  const [notesStatus, setNotesStatus] = useState("");
  const [messages, setMessages] = useState<ResearchMessage[]>([welcomeMessage]);

  const result = useMemo(() => {
    const fee = sellPrice * (platformFee / 100);
    const profit = sellPrice - buyCost - shipping - fee;
    const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
    return { fee, profit, margin };
  }, [buyCost, sellPrice, shipping, platformFee]);

  useEffect(() => {
    const workspace = loadResearchWorkspace(session);
    setNotes(workspace.notes || "");
    setSavedProducts(Array.isArray(workspace.savedProducts) ? workspace.savedProducts : []);
    setSavedCommunityPosts(Array.isArray(workspace.savedCommunityPosts) ? workspace.savedCommunityPosts : []);
    setSavedNotes(Array.isArray(workspace.savedNotes) ? workspace.savedNotes : []);
    setResearchTasks(Array.isArray(workspace.researchTasks) ? workspace.researchTasks : []);
    setActiveNoteId(workspace.activeNoteId ?? null);
  }, [session]);

  function persistWorkspace(nextWorkspace: Partial<ResearchWorkspace>) {
    const workspace = {
      notes,
      savedProducts,
      savedCommunityPosts,
      savedNotes,
      researchTasks,
      activeNoteId,
      ...nextWorkspace,
    };

    saveResearchWorkspace(session, workspace);
  }

  function saveNotes(nextNotes = notes) {
    persistWorkspace({ notes: nextNotes });
    setNotesStatus("Saved to your research workspace.");
  }

  function saveNoteSnapshot() {
    const content = notes.trim();
    if (!content) {
      setNotesStatus("Write a note before saving a snapshot.");
      return;
    }

    const nextNotes = [
      {
        id: Date.now(),
        title: content.split(/\s+/).slice(0, 8).join(" "),
        content,
        savedAt: new Date().toISOString(),
      },
      ...savedNotes,
    ].slice(0, 12);

    setSavedNotes(nextNotes);
    setActiveNoteId(nextNotes[0].id);
    persistWorkspace({ notes: content, savedNotes: nextNotes, activeNoteId: nextNotes[0].id });
    setNotesStatus("Saved as a private research note.");
  }

  function startNewNote() {
    setNotes("");
    setActiveNoteId(null);
    persistWorkspace({ notes: "", activeNoteId: null });
    setNotesStatus("Started a new private note.");
  }

  function openSavedNote(note: SavedNote) {
    setNotes(note.content);
    setActiveNoteId(note.id);
    persistWorkspace({ notes: note.content, activeNoteId: note.id });
    setNotesStatus("Loaded saved note.");
  }

  async function sendMessage() {
    const text = chatInput.trim();
    if (!text) return;
    const detectedTask = detectResearchTask(text);
    const nextTasks: ResearchTask[] = detectedTask
      ? [
          {
            id: Date.now(),
            type: detectedTask.type,
            label: detectedTask.label,
            prompt: text,
            status: "Queued" as const,
            createdAt: new Date().toISOString(),
          },
          ...researchTasks,
        ].slice(0, 20)
      : researchTasks;

    if (detectedTask) {
      setResearchTasks(nextTasks);
      persistWorkspace({ researchTasks: nextTasks });
    }

    const newUserMessage = {
      id: createMessageId("user"),
      role: "user" as const,
      text,
      createdAt: Date.now(),
    };
    setMessages((current) => [...current, newUserMessage]);
    setChatInput("");

    try {
      const history: ChatMessage[] = [...messages, newUserMessage].map((message) => ({
        id: message.id,
        role: message.role,
        content: message.text,
        createdAt: message.createdAt,
      }));

      const res = await sendPasarAIMessage(history, "research");
      setMessages((current) => [
        ...current,
        { id: createMessageId("assistant"), role: "assistant", text: res.content, createdAt: Date.now() },
      ]);
    } catch (err: unknown) {
      const fallback = detectedTask 
        ? `Saved request: ${detectedTask.label}. I will keep this in your AI task queue.`
        : "Pasar AI is currently offline. Please check your Groq API connection.";
      const message = err instanceof Error ? err.message : fallback;
      setMessages((current) => [
        ...current,
        { id: createMessageId("assistant"), role: "assistant", text: message || fallback, createdAt: Date.now() },
      ]);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Research Hub</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Chat, compare, calculate margins, and build your product thesis before deciding what to source.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-400 transition hover:bg-cyan-500/20">Generate SWOT</button>
          <button className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-400 transition hover:bg-cyan-500/20">Generate Launch Plan</button>
          <button className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-400 transition hover:bg-cyan-500/20">Supplier Summary</button>
          <button className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-400 transition hover:bg-cyan-500/20">Executive Summary</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col h-[500px]">
          <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">ProfitPilot AI</h2>
              <p className="text-xs text-slate-500">Always ready to research</p>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-2 pr-4">
            {messages.map((message, index) => (
              <div key={message.id || `${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`inline-block max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-cyan-500 text-foreground rounded-br-none"
                      : "border border-border bg-card text-muted-foreground rounded-tl-none"
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
              className="min-w-0 flex-1 rounded-full border border-border bg-muted/80 px-5 py-3 text-sm text-foreground outline-none focus:border-cyan-400 transition"
            />
            <button onClick={sendMessage} className="flex items-center justify-center rounded-full bg-cyan-500 p-3 text-foreground transition hover:bg-cyan-300">
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-5 h-full flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit3 className="h-5 w-5 text-cyan-300" />
                <div>
                  <h2 className="text-lg font-bold text-foreground">Research Notes & Docs</h2>
                  <p className="text-xs text-slate-500">{activeNoteId ? "Editing saved note" : "New draft"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={startNewNote} className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-cyan-300 transition">
                  <FilePlus2 className="h-4 w-4" />
                  New
                </button>
                <button onClick={() => saveNotes()} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition">Save Draft</button>
                <button onClick={saveNoteSnapshot} className="rounded-full border border-border px-3 py-1 text-xs font-bold text-muted-foreground transition hover:border-cyan-400 hover:text-cyan-300">Save Note</button>
              </div>
            </div>
            <textarea 
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                saveNotes(e.target.value);
              }}
              placeholder="Jot down your product thesis, supplier links, and cost estimates here..."
              className="w-full flex-1 resize-none rounded-lg border border-border bg-input p-4 text-sm leading-6 text-muted-foreground outline-none focus:border-cyan-400/50 transition"
            />
            {notesStatus && <p className="mt-3 text-xs text-cyan-300">{notesStatus}</p>}
            {savedNotes.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Private saved notes</p>
                {savedNotes.slice(0, 3).map((note) => (
                  <button
                    key={note.id}
                    onClick={() => openSavedNote(note)}
                    className={`block w-full rounded-lg border p-3 text-left transition hover:border-cyan-400/40 ${
                      activeNoteId === note.id ? "border-cyan-400/40 bg-cyan-400/10" : "border-border bg-muted/50"
                    }`}
                  >
                    <p className="line-clamp-1 text-sm font-bold text-foreground">{note.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(note.savedAt)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="mt-8 rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bookmark className="h-5 w-5 text-emerald-400" />
            <div>
              <h2 className="text-xl font-bold text-foreground">Saved Products</h2>
              <p className="text-sm text-slate-500">Products you are actively tracking and researching.</p>
            </div>
          </div>
        </div>
        {savedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-slate-500">
            <Package className="mb-4 h-10 w-10 opacity-50" />
            <p>No products saved yet.</p>
            <p className="text-sm">Browse products and click "Save Product" to track them here.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {savedProducts.map((p, index) => {
              const name = p.name || p.Product_Name || p["Product Name"] || p.Clean_Name_AI || p.product_name || "Unknown Product";
              const img = p.imageUrl || p.image_url || p.Image_URL || p.Image || p["Image URL"] || p.image || null;
              const price = p.price || p.Price_RM || p["Price RM"] || p.price_rm || "N/A";
              const platform = p.platform || p.Platform || "Unknown";
              const id = p.id || String(p.Product_URL || name || index);
              
              return (
                <div key={id} className="flex flex-col overflow-hidden rounded-xl border border-border bg-input transition hover:border-cyan-400/50">
                  <div className="relative h-32 w-full bg-muted">
                    {img ? (
                      <Image src={img} alt={name} fill unoptimized className="object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-600">No Image</div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="line-clamp-2 text-sm font-bold text-foreground">{name}</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>Platform: <span className="text-slate-200">{platform}</span></p>
                      <p>Price: <span className="text-slate-200 font-medium">{price}</span></p>
                    </div>
                    <div className="mt-auto pt-4 flex gap-2">
                      <button 
                        onClick={() => {
                          const nextProducts = savedProducts.filter(item => {
                            const itemId = item.id || String(item.Product_URL || item.name || item.Product_Name || "");
                            return itemId !== id;
                          });
                          setSavedProducts(nextProducts);
                          persistWorkspace({ savedProducts: nextProducts });
                        }}
                        className="flex-1 rounded-lg border border-border py-2 text-xs font-bold text-muted-foreground transition hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                      >
                        Unsave
                      </button>
                      <button 
                        onClick={() => onAnalyzeProduct?.(p)}
                        className="flex-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 py-2 text-xs font-bold text-cyan-400 transition hover:bg-cyan-500/20"
                      >
                        Analyze
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-cyan-300" />
            <div>
              <h2 className="text-xl font-bold text-foreground">AI Request Queue</h2>
              <p className="mt-1 text-xs text-slate-500">Saved tasks for monitoring, alerts, and future bot automation.</p>
            </div>
          </div>
        </div>
        {researchTasks.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {researchTasks.slice(0, 6).map((task) => (
              <div key={task.id} className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-foreground">{task.label}</p>
                  <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] font-bold text-cyan-300">{task.status}</span>
                </div>
                <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{task.prompt}</p>
                <p className="mt-3 text-[11px] text-slate-500">{formatDate(task.createdAt)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/50 p-5 text-sm text-muted-foreground">
            Try: "Monitor petshop products", "Save skincare products when available", or "Alert me when a high ROI product appears."
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <Bookmark className="h-5 w-5 text-cyan-300" />
          <div>
            <h2 className="text-xl font-bold text-foreground">Saved Community Posts</h2>
            <p className="mt-1 text-sm text-muted-foreground">Community insights you saved for product research.</p>
          </div>
        </div>
        {savedCommunityPosts.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {savedCommunityPosts.slice(0, 6).map((post) => (
              <div key={post.id} className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-foreground">{post.author}</p>
                  <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] font-bold text-cyan-300">{post.source}</span>
                </div>
                <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{post.content}</p>
                <p className="mt-3 text-[11px] text-slate-500">{formatDate(post.savedAt)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/50 p-5 text-sm text-muted-foreground">
            Saved community posts will appear here when you click Save on a community discussion.
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <Bookmark className="h-5 w-5 text-cyan-300" />
          <h2 className="text-xl font-bold text-foreground">Saved Products for Research</h2>
        </div>
        {savedProducts.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {savedProducts.slice(0, 6).map((product, index) => (
              <div key={`${getProductName(product)}-${index}`} className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="line-clamp-2 text-sm font-bold text-foreground">{getProductName(product)}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {product.Category || "Uncategorized"} / RM {product.Price_RM || product.Final_Price_Low || "N/A"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No saved products yet. Open any product and click Save Product to preload it here.
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-amber-300" />
            <h2 className="text-xl font-bold text-foreground">Seasonality Calendar</h2>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"].map((q, idx) => (
              <div key={q} className={`rounded-lg border border-border p-3 text-center ${idx === 2 ? "bg-amber-500/10 border-amber-500/30" : "bg-muted/50"}`}>
                <p className={`text-xs font-bold ${idx === 2 ? "text-amber-300" : "text-muted-foreground"}`}>{q}</p>
                <div className="mt-2 space-y-1">
                  <div className={`h-1.5 w-full rounded-full ${idx === 2 ? "bg-amber-400" : "bg-slate-700"}`}></div>
                  <div className={`h-1.5 w-3/4 mx-auto rounded-full ${idx === 2 ? "bg-amber-400/50" : "bg-slate-700/50"}`}></div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            <strong>Insight:</strong> Peak demand for Sports & Outdoors occurs in Q3. Consider ramping up inventory by late June.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <Target className="h-5 w-5 text-indigo-300" />
            <h2 className="text-xl font-bold text-foreground">Target Audience Insights</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-sm text-muted-foreground">Demographic</span>
              <span className="text-sm font-medium text-foreground">Males, 18-34 (62%)</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-sm text-muted-foreground">Primary Geo</span>
              <span className="text-sm font-medium text-foreground">Kuala Lumpur, Selangor</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-sm text-muted-foreground">Interests</span>
              <span className="text-sm font-medium text-foreground">Gym, Crossfit, Running</span>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            <strong>Hook Idea:</strong> "Stop hurting your back during deadlifts..."
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <Calculator className="h-5 w-5 text-emerald-300" />
            <h2 className="text-xl font-bold text-foreground">Quick margin calculator</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <NumberInput label="Source cost" value={buyCost} onChange={setBuyCost} />
            <NumberInput label="Sell price" value={sellPrice} onChange={setSellPrice} />
            <NumberInput label="Shipping cost" value={shipping} onChange={setShipping} />
            <NumberInput label="Platform fee %" value={platformFee} onChange={setPlatformFee} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold text-foreground">Estimated result</h2>
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
    <label className="grid gap-2 text-sm text-muted-foreground">
      {label}
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-lg border border-border bg-muted px-4 py-3 text-foreground outline-none focus:border-cyan-400 transition"
      />
    </label>
  );
}

function Metric({ label, value, highlight = "text-foreground" }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-bold ${highlight}`}>{value}</span>
    </div>
  );
}

function getResearchStorageKey(session: Session | null) {
  return `profitpilot-research-${session?.user?.email?.toLowerCase() || "local"}`;
}

function loadResearchWorkspace(session: Session | null) {
  if (typeof window === "undefined") return { notes: "", savedProducts: [] };
  try {
    const raw = localStorage.getItem(getResearchStorageKey(session));
    return raw ? JSON.parse(raw) : { notes: "", savedProducts: [] };
  } catch {
    return { notes: "", savedProducts: [] };
  }
}

function saveResearchWorkspace(session: Session | null, workspace: ResearchWorkspace) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getResearchStorageKey(session), JSON.stringify(workspace));
  } catch {
    const trimmedWorkspace = {
      ...workspace,
      savedProducts: workspace.savedProducts.slice(0, 12),
      savedNotes: workspace.savedNotes?.slice(0, 6),
      researchTasks: workspace.researchTasks?.slice(0, 10),
    };
    localStorage.setItem(getResearchStorageKey(session), JSON.stringify(trimmedWorkspace));
  }
}

function getProductName(product: any) {
  if (!product || typeof product !== "object") return "Unknown product";
  const candidate = product as Record<string, unknown>;
  const clean = candidate.Clean_Name_AI || candidate.clean_name_ai;
  if (clean && clean !== "The language entered is not supported at this time.") return String(clean);
  return String(candidate.Product_Name || candidate.product_name || "Unknown product");
}

function detectResearchTask(text: string): Pick<ResearchTask, "type" | "label"> | null {
  const normalized = text.toLowerCase();
  const target = extractTarget(text);

  if (/(monitor|watch|track|alert|notify)/.test(normalized)) {
    return {
      type: "monitor",
      label: `Monitor ${target}`,
    };
  }

  if (/(save|bookmark|add).*(product|products|item|items|available|found)/.test(normalized)) {
    return {
      type: "save",
      label: `Save matching products: ${target}`,
    };
  }

  if (/(research|find|search|scan|look for)/.test(normalized)) {
    return {
      type: "research",
      label: `Research ${target}`,
    };
  }

  return null;
}

function extractTarget(text: string) {
  const cleaned = text
    .replace(/\b(please|can you|could you|i want you to|request(ed)?|ai|bot|products?|items?|when available|for me|and save them|save them|monitor|watch|track|alert|notify|research|find|search|scan|look for)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "matching products";
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-MY", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "Saved";
  }
}

type SavedNote = {
  id: number;
  title: string;
  content: string;
  savedAt: string;
};

type ResearchTask = {
  id: number;
  type: "monitor" | "save" | "research";
  label: string;
  prompt: string;
  status: "Queued";
  createdAt: string;
};

type ResearchWorkspace = {
  notes: string;
  savedProducts: any[];
  savedCommunityPosts: SavedCommunityPost[];
  savedNotes: SavedNote[];
  researchTasks: ResearchTask[];
  activeNoteId?: number | null;
};

type SavedCommunityPost = {
  id: string;
  author: string;
  role: string;
  content: string;
  savedAt: string;
  source: string;
};

function getProductMatches(prompt: string, products: any[]) {
  const terms = extractTarget(prompt)
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2);

  if (terms.length === 0 || products.length === 0) return [];

  return products
    .map((product) => {
      const candidate = product as Record<string, unknown>;
      const searchable = [
        getProductName(product),
        candidate.Category,
        candidate.category,
        candidate.Brand,
        candidate.brand,
        candidate.Store_Name,
        candidate.Product_Name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const score = terms.reduce((total, term) => total + (searchable.includes(term) ? 1 : 0), 0);
      return { product, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => item.product);
}

function buildProductResearchReply(matches: any[], taskLabel?: string) {
  const lines = matches.map((product, index) => {
    const name = getProductName(product);
    const candidate = product as Record<string, unknown>;
    const category = candidate.Category || candidate.category || "Uncategorized";
    const price = candidate.Price_RM || candidate.Final_Price_Low || "N/A";
    const sales = candidate.Sales || candidate.sales || "N/A";
    return `${index + 1}. ${name} | ${category} | RM ${price} | Sales ${sales}`;
  });

  return `${taskLabel ? `Saved request: ${taskLabel}.\n\n` : ""}I found ${matches.length} matching in-house products from your Supabase dataset:\n${lines.join("\n")}\n\nUse these as your first research set before checking external suppliers or alerts.`;
}

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
