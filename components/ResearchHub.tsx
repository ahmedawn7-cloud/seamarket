"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Bell, Bot, Bookmark, Calculator, CalendarDays, Edit3, FilePlus2, Package, Send, Target } from "lucide-react";
import Image from "next/image";
import { sendPasarAIMessage } from "@/lib/chat/chatClient";
import { getBrowserSupabaseClient } from "@/lib/supabase/browserClient";
import SeasonalMiniDashboard from "@/components/seasonal/SeasonalMiniDashboard";
import type { ChatMessage } from "@/types/chat";

const supabase = getBrowserSupabaseClient();

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
  onAnalyzeProduct,
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
  const [workspaceStatus, setWorkspaceStatus] = useState("");
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [messages, setMessages] = useState<ResearchMessage[]>([welcomeMessage]);
  const [aiBusy, setAiBusy] = useState(false);

  const result = useMemo(() => {
    const fee = sellPrice * (platformFee / 100);
    const profit = sellPrice - buyCost - shipping - fee;
    const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
    return { fee, profit, margin };
  }, [buyCost, sellPrice, shipping, platformFee]);

  useEffect(() => {
    loadCloudWorkspace();
  }, [session?.user?.id]);

  async function loadCloudWorkspace() {
    setWorkspaceLoading(true);
    setWorkspaceStatus("");
    setSavedProducts([]);
    setSavedCommunityPosts([]);
    setSavedNotes([]);
    setResearchTasks([]);
    setActiveNoteId(null);

    if (!supabase || !session?.user) {
      setWorkspaceLoading(false);
      setWorkspaceStatus("Sign in with Supabase to load saved research across devices.");
      return;
    }

    let unavailableSections = 0;

    const { data: watchlist, error: watchlistError } = await supabase
      .from("user_watchlist")
      .select("id,product_id,snapshot,notes,created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (watchlistError) {
      unavailableSections += 1;
    } else {
      setSavedProducts((watchlist ?? []).map((item: any) => item.snapshot || { id: item.product_id, notes: item.notes }));
    }

    const { data: notesData, error: notesError } = await supabase
      .from("research_notes")
      .select("id,title,content,created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (notesError) {
      unavailableSections += 1;
    } else {
      setSavedNotes(
        (notesData ?? []).map((note: any) => ({
          id: Number(note.id) || Date.parse(note.created_at),
          title: String(note.title || "Untitled note"),
          content: String(note.content || ""),
          savedAt: String(note.created_at || new Date().toISOString()),
        })),
      );
    }

    const { data: tasksData, error: tasksError } = await supabase
      .from("research_tasks")
      .select("id,type,label,prompt,status,created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (tasksError) {
      unavailableSections += 1;
    } else {
      setResearchTasks(
        (tasksData ?? []).map((task: any) => ({
          id: Number(task.id) || Date.parse(task.created_at),
          type: task.type || "research",
          label: String(task.label || "Research task"),
          prompt: String(task.prompt || ""),
          status: task.status || "Queued",
          createdAt: String(task.created_at || new Date().toISOString()),
        })),
      );
    }

    const { data: communitySaves, error: communityError } = await supabase
      .from("user_saved_community_posts")
      .select("id,post_id,snapshot,created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (communityError) {
      unavailableSections += 1;
    } else {
      setSavedCommunityPosts(
        (communitySaves ?? []).map((item: any) => ({
          id: String(item.post_id || item.id),
          author: String(item.snapshot?.author || "Community member"),
          role: String(item.snapshot?.role || "Member"),
          content: String(item.snapshot?.content || ""),
          savedAt: String(item.created_at || new Date().toISOString()),
          source: "Community Hub",
        })),
      );
    }

    setWorkspaceStatus(
      unavailableSections > 0
        ? "Your research workspace loaded with limited cloud sync. Some notes, tasks, or saved items may appear after their Supabase tables are enabled."
        : "Cloud research workspace loaded from Supabase.",
    );
    setWorkspaceLoading(false);
  }

  async function saveNoteSnapshot() {
    const content = notes.trim();
    if (!content) {
      setNotesStatus("Write a note before saving a snapshot.");
      return;
    }

    if (!supabase || !session?.user) {
      setNotesStatus("Sign in with Supabase to save research notes across devices.");
      return;
    }

    setNotesStatus("Saving note...");
    const title = content.split(/\s+/).slice(0, 8).join(" ");
    const { data, error } = await supabase
      .from("research_notes")
      .insert({ user_id: session.user.id, title, content })
      .select("id,title,content,created_at")
      .single();

    if (error) {
      console.warn("Research notes save unavailable:", error.message);
      setNotesStatus("Cloud note saving is not ready yet. Keep working in this draft and try again later.");
      return;
    }

    const nextNotes = [
      {
        id: Number(data.id) || Date.parse(data.created_at),
        title: String(data.title || title),
        content: String(data.content || content),
        savedAt: String(data.created_at || new Date().toISOString()),
      },
      ...savedNotes,
    ].slice(0, 12);

    setSavedNotes(nextNotes);
    setActiveNoteId(nextNotes[0].id);
    setNotesStatus("Saved as a private Supabase research note.");
  }

  function startNewNote() {
    setNotes("");
    setActiveNoteId(null);
    setNotesStatus("Started a new draft. It will not sync until you click Save Note.");
  }

  function openSavedNote(note: SavedNote) {
    setNotes(note.content);
    setActiveNoteId(note.id);
    setNotesStatus("Loaded saved note.");
  }

  async function sendMessage() {
    const text = chatInput.trim();
    if (!text || aiBusy) return;
    const detectedTask = detectResearchTask(text);

    if (detectedTask) {
      const queuedTask: ResearchTask = {
        id: Date.now(),
        type: detectedTask.type,
        label: detectedTask.label,
        prompt: text,
        status: "Queued",
        createdAt: new Date().toISOString(),
      };

      setResearchTasks((current) => [queuedTask, ...current].slice(0, 20));

      if (supabase && session?.user) {
        const { error } = await supabase.from("research_tasks").insert({
          user_id: session.user.id,
          type: detectedTask.type,
          label: detectedTask.label,
          prompt: text,
          status: "Queued",
        });
        if (error) {
          console.warn("Research tasks save unavailable:", error.message);
          setNotesStatus("Task tracking will appear once the cloud task table is ready.");
        }
      } else {
        setNotesStatus("Sign in with Supabase to persist AI task requests.");
      }
    }

    const newUserMessage = {
      id: createMessageId("user"),
      role: "user" as const,
      text,
      createdAt: Date.now(),
    };
    setMessages((current) => [...current, newUserMessage]);
    setChatInput("");
    setAiBusy(true);

    try {
      const history: ChatMessage[] = [...messages, newUserMessage].map((message) => ({
        id: message.id,
        role: message.role,
        content: message.text,
        createdAt: message.createdAt,
      }));

      const res = await sendPasarAIMessage(history, "research", {
        selectedProduct: savedProducts[0] || null,
        savedNotes: notes.trim()
          ? [{ content: notes.trim() }]
          : savedNotes.slice(0, 2).map((note) => ({ content: note.content })),
      });
      setMessages((current) => [
        ...current,
        { id: createMessageId("assistant"), role: "assistant", text: res.content, createdAt: Date.now() },
      ]);
    } catch (err: unknown) {
      const fallback = "AI provider not connected. Configure Ollama or Groq.";
      const message = err instanceof Error ? err.message : fallback;
      setMessages((current) => [
        ...current,
        { id: createMessageId("assistant"), role: "assistant", text: message || fallback, createdAt: Date.now() },
      ]);
    } finally {
      setAiBusy(false);
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
          {[
            ["Research this product", "Research this product and tell me whether it is worth testing in Malaysia."],
            ["Generate SWOT", "Generate a SWOT analysis for this product idea."],
            ["Generate launch plan", "Generate a short launch plan for this product in Shopee and TikTok Shop."],
            ["Summarize supplier risks", "Summarize supplier risks and what I should verify before sourcing."],
            ["Explain Malaysia compliance concerns", "Explain the Malaysia compliance concerns I should check before listing this product."],
          ].map(([label, prompt]) => (
            <button
              key={label}
              onClick={() => setChatInput(prompt)}
              className="rounded-lg border border-border bg-muted/60 px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:border-cyan-400 hover:text-cyan-300"
            >
              {label}
            </button>
          ))}
        </div>
        {workspaceLoading && <p className="mt-3 text-xs text-cyan-300">Loading Supabase research workspace...</p>}
        {workspaceStatus && <p className="mt-3 max-w-3xl text-xs leading-5 text-cyan-300">{workspaceStatus}</p>}
      </div>

      <SeasonalMiniDashboard onResearch={(category) => setChatInput(`Please analyze the market opportunity for ${category} in Malaysia.`)} />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <div className="flex h-[500px] flex-col rounded-xl border border-border bg-card p-5">
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
                      ? "rounded-br-none bg-cyan-500 text-foreground"
                      : "rounded-tl-none border border-border bg-card text-muted-foreground"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {aiBusy && (
              <div className="flex justify-start">
                <div className="inline-block max-w-[85%] rounded-2xl rounded-tl-none border border-border bg-card px-4 py-3 text-sm leading-6 text-muted-foreground">
                  Pasar AI is checking your research workspace...
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2 pt-2">
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") sendMessage();
              }}
              placeholder="Ask about a product or niche..."
              className="min-w-0 flex-1 rounded-full border border-border bg-muted/80 px-5 py-3 text-sm text-foreground outline-none transition focus:border-cyan-400"
            />
            <button onClick={sendMessage} disabled={aiBusy || !chatInput.trim()} className="flex items-center justify-center rounded-full bg-cyan-500 p-3 text-foreground transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50">
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex h-full flex-col rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit3 className="h-5 w-5 text-cyan-300" />
                <div>
                  <h2 className="text-lg font-bold text-foreground">Research Notes & Docs</h2>
                  <p className="text-xs text-slate-500">{activeNoteId ? "Viewing saved note" : "New draft"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={startNewNote} className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground transition hover:text-cyan-300">
                  <FilePlus2 className="h-4 w-4" />
                  New
                </button>
                <button onClick={saveNoteSnapshot} className="rounded-full border border-border px-3 py-1 text-xs font-bold text-muted-foreground transition hover:border-cyan-400 hover:text-cyan-300">Save Note</button>
              </div>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jot down your product thesis, supplier links, and cost estimates here..."
              className="w-full flex-1 resize-none rounded-lg border border-border bg-input p-4 text-sm leading-6 text-muted-foreground outline-none transition focus:border-cyan-400/50"
            />
            {notesStatus && <p className="mt-3 text-xs text-cyan-300">{notesStatus}</p>}
            {savedNotes.length > 0 ? (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Private Supabase notes</p>
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
            ) : (
              <p className="mt-4 text-xs text-slate-500">No cloud-saved notes yet. Save your first note to build a reusable research history.</p>
            )}
          </div>
        </div>
      </div>

      <SavedProductsSection products={savedProducts} onAnalyzeProduct={onAnalyzeProduct} />
      <ResearchTasksSection researchTasks={researchTasks} />
      <SavedCommunitySection posts={savedCommunityPosts} />

      <div className="grid gap-6 lg:grid-cols-2">
        <PendingInsight icon={CalendarDays} title="Seasonality Calendar" text="Data pending: seasonality insights need historical product snapshots before this panel can show real signals." />
        <PendingInsight icon={Target} title="Target Audience Insights" text="Audience intelligence pending: connect marketplace audience data before showing targeting recommendations." />
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

function SavedProductsSection({ products, onAnalyzeProduct }: { products: any[]; onAnalyzeProduct?: (product: any) => void }) {
  return (
    <section className="mt-8 rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-3">
        <Bookmark className="h-5 w-5 text-emerald-400" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Saved Products</h2>
          <p className="text-sm text-slate-500">Cloud watchlist items from Supabase user_watchlist.</p>
        </div>
      </div>
      {products.length === 0 ? (
        <EmptyState icon={Package} title="No cloud-saved products yet" text="Open any product and click Save Product. Items appear here when user_watchlist sync is available." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, index) => (
            <ProductTile key={`${getProductName(product)}-${index}`} product={product} onAnalyzeProduct={onAnalyzeProduct} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProductTile({ product, onAnalyzeProduct }: { product: any; onAnalyzeProduct?: (product: any) => void }) {
  const name = getProductName(product);
  const img = product.imageUrl || product.image_url || product.Image_URL || product.Image || product["Image URL"] || product.image || null;
  const price = product.price || product.Price_RM || product["Price RM"] || product.price_rm || "N/A";
  const platform = product.platform || product.Platform || "Unknown";

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-input transition hover:border-cyan-400/50">
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
          <p>Price: <span className="font-medium text-slate-200">{price}</span></p>
        </div>
        <button
          onClick={() => onAnalyzeProduct?.(product)}
          className="mt-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-2 text-xs font-bold text-cyan-400 transition hover:bg-cyan-500/20"
        >
          Analyze
        </button>
      </div>
    </div>
  );
}

function ResearchTasksSection({ researchTasks }: { researchTasks: ResearchTask[] }) {
  return (
    <section className="mt-8 rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-3">
        <Bell className="h-5 w-5 text-cyan-300" />
        <div>
          <h2 className="text-xl font-bold text-foreground">AI Request Queue</h2>
          <p className="mt-1 text-xs text-slate-500">Supabase research_tasks requests for monitoring, alerts, and future bot automation.</p>
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
        <EmptyState icon={Bell} title="No cloud AI tasks yet" text='Try: "Monitor petshop products" or "Alert me when a high ROI product appears."' />
      )}
    </section>
  );
}

function SavedCommunitySection({ posts }: { posts: SavedCommunityPost[] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-3">
        <Bookmark className="h-5 w-5 text-cyan-300" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Saved Community Posts</h2>
          <p className="mt-1 text-sm text-muted-foreground">Community insights saved to Supabase user_saved_community_posts.</p>
        </div>
      </div>
      {posts.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {posts.slice(0, 6).map((post) => (
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
        <EmptyState icon={Bookmark} title="No saved community posts yet" text="Save a community discussion to keep it inside your research workspace." />
      )}
    </section>
  );
}

function PendingInsight({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-3">
        <Icon className="h-5 w-5 text-cyan-300" />
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
      <div className="rounded-lg border border-dashed border-border bg-muted/50 p-5 text-sm leading-6 text-muted-foreground">{text}</div>
    </section>
  );
}

function EmptyState({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center text-slate-500">
      <Icon className="mb-4 h-10 w-10 opacity-50" />
      <p className="font-bold text-foreground">{title}</p>
      <p className="mt-1 max-w-xl text-sm">{text}</p>
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
        className="rounded-lg border border-border bg-muted px-4 py-3 text-foreground outline-none transition focus:border-cyan-400"
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

function getProductName(product: any) {
  if (!product || typeof product !== "object") return "Unknown product";
  const candidate = product as Record<string, unknown>;
  const clean = candidate.Clean_Name_AI || candidate.clean_name_ai;
  if (clean && clean !== "The language entered is not supported at this time.") return String(clean);
  return String(candidate.Product_Name || candidate.product_name || candidate.name || "Unknown product");
}

function detectResearchTask(text: string): Pick<ResearchTask, "type" | "label"> | null {
  const normalized = text.toLowerCase();
  const target = extractTarget(text);

  if (/(monitor|watch|track|alert|notify)/.test(normalized)) return { type: "monitor", label: `Monitor ${target}` };
  if (/(save|bookmark|add).*(product|products|item|items|available|found)/.test(normalized)) return { type: "save", label: `Save matching products: ${target}` };
  if (/(research|find|search|scan|look for)/.test(normalized)) return { type: "research", label: `Research ${target}` };

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
    return new Intl.DateTimeFormat("en-MY", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return "Saved";
  }
}

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

type SavedCommunityPost = {
  id: string;
  author: string;
  role: string;
  content: string;
  savedAt: string;
  source: string;
};
