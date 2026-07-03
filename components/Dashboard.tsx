"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { Activity, Beaker, DollarSign, Filter, Home, LogOut, PackageSearch, Search, Sun, TrendingUp, Truck, User, Users } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductDrawer from "@/components/ProductDrawer";
import HomeView from "@/components/HomeView";
import CommunityHub from "@/components/CommunityHub";
import ResearchHub from "@/components/ResearchHub";
import SourcingIntelligence from "@/components/SourcingIntelligence";
import UserDashboard from "@/components/UserDashboard";
import AuthPanel, { getAccessPlan, type AccessPlan } from "@/components/AuthPanel";
import AccessGate from "@/components/AccessGate";

const LOGO_URL = "/profit-pilot-logo.png";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function Dashboard({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState<any[]>(Array.isArray(initialProducts) ? initialProducts : []);
  const [productsStatus, setProductsStatus] = useState<"loading" | "ready" | "error">(
    initialProducts?.length ? "ready" : "loading",
  );
  const [productsError, setProductsError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerProduct, setDrawerProduct] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("Home");
  const [activePlatform, setActivePlatform] = useState("All");
  const [session, setSession] = useState<Session | null>(null);
  const [profilePlan, setProfilePlan] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [devAdminUnlocked, setDevAdminUnlocked] = useState(false);
  const [comfortTheme, setComfortTheme] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setProductsStatus("loading");
      setProductsError("");

      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || "Product API request failed.");
        }

        if (isMounted) {
          setProducts(Array.isArray(payload.products) ? payload.products : []);
          setProductsStatus("ready");
        }
      } catch (error) {
        if (isMounted) {
          setProductsStatus("error");
          setProductsError(error instanceof Error ? error.message : "Product API request failed.");
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;

    async function loadSession() {
      const { data } = await supabase!.auth.getSession();
      if (!isMounted) return;
      setSession(data.session);
      if (data.session?.user) {
        loadProfilePlan(data.session.user.id);
      }
    }

    async function loadProfilePlan(userId: string) {
      const { data } = await supabase!
        .from("user_profiles")
        .select("plan")
        .eq("id", userId)
        .maybeSingle();

      if (isMounted) {
        setProfilePlan(data?.plan ?? null);
      }
    }

    loadSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        loadProfilePlan(nextSession.user.id);
      } else {
        setProfilePlan(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    setDevAdminUnlocked(isLocalhost && localStorage.getItem("profitpilot-dev-admin") === "true");
    setComfortTheme(localStorage.getItem("profitpilot-comfort-theme") === "true");
  }, []);

  const safeProducts = products;
  const accessPlan = devAdminUnlocked ? "pro" : getAccessPlan(session, profilePlan);
  const productLimit = accessPlan === "pro" ? safeProducts.length : accessPlan === "registered" ? 100 : 12;

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();

    return safeProducts.slice(0, productLimit || safeProducts.length).filter((product) => {
      const name =
        product.Clean_Name_AI ||
        product.clean_name_ai ||
        product.Product_Name ||
        product.product_name ||
        "";
      const platform = getProductPlatform(product);
      const category = product.Category || product.category || "";
      const brand = product.Brand || product.brand || "";
      const store = product.Store_Name || product.store_name || "";
      const productUrl = product.Product_URL || product.product_url || "";

      const platformMatches =
        activePlatform === "All" ||
        platform === "Marketplace" ||
        platform.toLowerCase().includes(activePlatform.toLowerCase());
      const searchMatches =
        !q.trim() ||
        `${name} ${platform} ${category} ${brand} ${store} ${productUrl}`.toLowerCase().includes(q);

      return platformMatches && searchMatches;
    });
  }, [safeProducts, searchQuery, activePlatform, productLimit]);

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    localStorage.removeItem("profitpilot-dev-admin");
    setDevAdminUnlocked(false);
    setSession(null);
    setProfilePlan(null);
    setActiveTab("Home");
  }

  function updateSession(nextSession: Session | null, nextProfilePlan?: string | null) {
    setSession(nextSession);
    if (nextProfilePlan !== undefined) {
      setProfilePlan(nextProfilePlan);
    }
  }

  function toggleComfortTheme() {
    setComfortTheme((current) => {
      const next = !current;
      localStorage.setItem("profitpilot-comfort-theme", String(next));
      return next;
    });
  }

  const tabs = [
    { id: "Home", icon: Home, label: "Home" },
    { id: "Products", icon: PackageSearch, label: "Products" },
    { id: "Research", icon: Beaker, label: "Research Hub" },
    { id: "Sourcing", icon: Truck, label: "Sourcing" },
    { id: "Community", icon: Users, label: "Community" },
    { id: "Profile", icon: User, label: "User Dashboard" },
  ];

  return (
    <>
      <div className={`fixed inset-0 -z-10 ${comfortTheme ? "bg-[#eef7fb]" : "bg-[#050816]"}`}>
        <div className={`absolute inset-0 ${comfortTheme ? "bg-[linear-gradient(180deg,#f8fdff_0%,#eef7fb_45%,#e7f0f5_100%)]" : "bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_30%),linear-gradient(180deg,#050816_0%,#08111f_45%,#050816_100%)]"}`} />
      </div>

      <div className={`relative z-10 flex min-h-screen flex-col ${comfortTheme ? "comfort-theme" : ""}`}>
        <header className="sticky top-0 z-50 border-b border-cyan-400/10 bg-[#070b16]/88 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex min-h-16 items-center justify-between gap-4 py-3">
              <button onClick={() => setActiveTab("Home")} className="flex shrink-0 items-center gap-3 text-left">
                <img src={LOGO_URL} alt="Profit Pilot AI" className="h-10 w-10 object-contain" />
                <span className="hidden text-xl font-bold tracking-tight text-white sm:block">
                  Profit Pilot AI
                </span>
              </button>

              <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 shadow-lg shadow-cyan-500/10"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>

              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <button
                  onClick={toggleComfortTheme}
                  className="rounded-full border border-cyan-400/30 bg-transparent p-2 text-cyan-300 transition hover:bg-cyan-400/10"
                  aria-label="Toggle comfort theme"
                  title="Toggle comfort theme"
                >
                  <Sun className="h-4 w-4" />
                </button>
                {session?.user || devAdminUnlocked ? (
                  <>
                    <button
                      onClick={() => setActiveTab("Profile")}
                      className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-300"
                    >
                      {devAdminUnlocked ? "Local Pro" : accessPlan === "pro" ? "Pro Access" : "Registered"}
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="rounded-full border border-slate-700 bg-transparent p-2 text-slate-400 transition hover:text-white"
                      aria-label="Sign out"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="rounded-full border border-cyan-400/30 bg-transparent px-5 py-2 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400/10"
                  >
                    Login / Sign Up
                  </button>
                )}
              </div>
            </div>

            <nav className="flex gap-2 overflow-x-auto pb-3 lg:hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
              {!session?.user && (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-cyan-400/30 px-4 py-2 text-sm font-bold text-cyan-300"
                >
                  Login
                </button>
              )}
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {activeTab === "Home" && <HomeView onExploreProducts={() => setActiveTab("Products")} />}

          {activeTab === "Products" && (
            <section className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">Product Radar</h1>
                  <p className="mt-2 text-sm text-slate-400">
                    {productsStatus === "loading"
                      ? "Loading Supabase products..."
                      : safeProducts.length > 0
                        ? `${safeProducts.length} Supabase products loaded from MYProductScout_Master. ${accessPlan === "guest" ? "Guest preview is limited to 12 products." : accessPlan === "registered" ? "Registered access shows 100 products." : "Pro access is unlocked."}`
                        : "No Supabase products loaded yet."}
                  </p>
                  {productsStatus === "error" && (
                    <p className="mt-2 text-xs text-red-300">Product API error: {productsError}</p>
                  )}
                  {safeProducts[0] && (
                    <p className="mt-2 max-w-3xl text-xs text-cyan-300">
                      First product: {getDisplayProductName(safeProducts[0])} / Rank{" "}
                      {getDisplayProductRank(safeProducts[0])} / RM {getDisplayProductPrice(safeProducts[0])}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>Last updated: 2 mins ago</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
                <div className="flex gap-6">
                  {["All", "Shopee", "Lazada", "TikTok Shop"].map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setActivePlatform(platform)}
                      className={`pb-4 -mb-[17px] text-sm font-medium transition ${
                        activePlatform === platform
                          ? "border-b-2 border-cyan-400 text-cyan-400"
                          : "border-b-2 border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-[#070b16] py-2 pl-10 pr-4 text-sm text-white outline-none transition focus:border-cyan-400"
                    />
                  </div>
                  <button className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#070b16] px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400">
                    <Filter className="h-4 w-4" />
                    Filters (3)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
                <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                    <PackageSearch className="h-4 w-4 text-cyan-400" />
                    Products Tracked
                  </div>
                  <p className="text-2xl font-bold text-white">{safeProducts.length}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    Shown Now
                  </div>
                  <p className="text-2xl font-bold text-white">{filtered.length}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                    <Activity className="h-4 w-4 text-amber-400" />
                    Avg. Margin
                  </div>
                  <p className="text-2xl font-bold text-white">32.6%</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                    <DollarSign className="h-4 w-4 text-indigo-400" />
                    Total Sales (Est.)
                  </div>
                  <p className="text-2xl font-bold text-white">RM 3.2M</p>
                </div>
              </div>

              {filtered.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filtered.map((product, index) => (
                    <ProductCard
                      key={`${getProductKey(product)}-${index}`}
                      product={product}
                      onResearch={(item) => setDrawerProduct(item)}
                      onQuickView={(item) => setDrawerProduct(item)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-700 bg-black/20 py-16 text-center text-slate-400">
                  No products found. If this should show data, check your Supabase URL, anon key, and product table RLS.
                </div>
              )}
            </section>
          )}

          {activeTab === "Research" && (
            <AccessGate
              plan={accessPlan}
              required="registered"
              title="Research Hub requires a registered account"
              description="Create a free account to save research notes, use the AI research workspace, and build product validation workflows."
              onLogin={() => setIsAuthOpen(true)}
            >
              <ResearchHub session={session} />
            </AccessGate>
          )}
          {activeTab === "Sourcing" && (
            <AccessGate
              plan={accessPlan}
              required="pro"
              title="Sourcing Intelligence is a Pro workspace"
              description="Supplier comparison, logistics estimates, and sourcing workflows are reserved for Pro access."
              onLogin={() => setIsAuthOpen(true)}
            >
              <SourcingIntelligence products={safeProducts} />
            </AccessGate>
          )}
          {activeTab === "Community" && (
            <AccessGate
              plan={accessPlan}
              required="registered"
              title="Community requires a registered account"
              description="Register to access discussion topics, events, and product operator groups."
              onLogin={() => setIsAuthOpen(true)}
            >
              <CommunityHub session={session} />
            </AccessGate>
          )}
          {activeTab === "Profile" && (
            <AccessGate
              plan={accessPlan}
              required="registered"
              title="Login to view your account"
              description="Your profile, plan, saved products, and settings are connected to Supabase Auth."
              onLogin={() => setIsAuthOpen(true)}
            >
              <UserDashboard session={session} accessPlan={accessPlan} />
            </AccessGate>
          )}
        </main>

        <footer className="border-t border-slate-800/80 px-4 py-6 text-center text-xs text-slate-500">
          <a href="/terms" className="hover:text-cyan-300">Terms of Service</a>
          <span className="mx-3">/</span>
          <a href="/privacy" className="hover:text-cyan-300">Privacy Policy</a>
        </footer>
      </div>

      <ProductDrawer
        product={drawerProduct}
        session={session}
        onClose={() => setDrawerProduct(null)}
        onResearch={() => {
          setDrawerProduct(null);
          setActiveTab("Research");
        }}
      />
      <AuthPanel
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSessionChange={updateSession}
        onDevUnlock={() => setDevAdminUnlocked(true)}
      />
    </>
  );
}

function getProductKey(product: any) {
  return (
    product?.id ||
    product?.Product_URL ||
    product?.Product_Name ||
    product?.Clean_Name_AI ||
    "product"
  );
}

function getProductPlatform(product: any) {
  const explicitPlatform = product?.Platform || product?.platform;
  if (explicitPlatform) return String(explicitPlatform);

  const searchable = `${product?.Product_URL || ""} ${product?.Store_Name || ""} ${product?.Category || ""}`.toLowerCase();

  if (searchable.includes("shopee")) return "Shopee";
  if (searchable.includes("lazada")) return "Lazada";
  if (searchable.includes("tiktok") || searchable.includes("tikaka")) return "TikTok Shop";

  return "Marketplace";
}

function getDisplayProductName(product: any) {
  const cleanName = product?.clean_name_ai || product?.Clean_Name_AI;
  const productName = product?.product_name || product?.Product_Name;

  return cleanName && cleanName !== "The language entered is not supported at this time."
    ? cleanName
    : productName || "Missing name";
}

function getDisplayProductRank(product: any) {
  return product?.rank ?? product?.Rank ?? product?.Internal_Rank ?? "Missing rank";
}

function getDisplayProductPrice(product: any) {
  return product?.price ?? product?.Price_RM ?? product?.Final_Price_Low ?? "Missing price";
}
