"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { Session } from "@supabase/supabase-js";
import { Activity, Beaker, DollarSign, Filter, Home, LogOut, PackageSearch, Search, Sun, TrendingUp, Truck, User, Users, X } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browserClient";
import ProductCard from "@/components/ProductCard";
import ProductDrawer from "@/components/ProductDrawer";
import HomeView from "@/components/HomeView";
import CommunityHub from "@/components/CommunityHub";
import ResearchHub from "@/components/ResearchHub";
import SourcingIntelligence from "@/components/SourcingIntelligence";
import UserDashboard from "@/components/UserDashboard";
import AuthPanel, { getAccessPlan, type AccessPlan } from "@/components/AuthPanel";
import AccessGate from "@/components/AccessGate";

import PublicHeader from "@/components/nav/PublicHeader";
import AppSidebar from "@/components/nav/AppSidebar";
import AppHeader from "@/components/nav/AppHeader";
import MobileDrawer from "@/components/nav/MobileDrawer";
import FeaturesPage from "@/components/FeaturesPage";

const LOGO_URL = "/profit-pilot-logo.png";
const supabase = getBrowserSupabaseClient();

export default function Dashboard({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState<any[]>(Array.isArray(initialProducts) ? initialProducts : []);
  const [productsStatus, setProductsStatus] = useState<"loading" | "ready" | "error">(
    initialProducts?.length ? "ready" : "loading",
  );
  const [productsError, setProductsError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerProduct, setDrawerProduct] = useState<any | null>(null);
  const [previewProduct, setPreviewProduct] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("Home");
  const [activePlatform, setActivePlatform] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profilePlan, setProfilePlan] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [comfortTheme, setComfortTheme] = useState(false);
  const [sidebarNotifications, setSidebarNotifications] = useState<Record<string, number>>({});

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
    setComfortTheme(localStorage.getItem("profitpilot-comfort-theme") === "true");
  }, []);

  // Load persisted sidebar notification counts from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("pp-sidebar-notifs");
      if (stored) setSidebarNotifications(JSON.parse(stored));
    } catch {}
  }, []);

  // Seed initial notifications for demo (Community + Products) once per session
  useEffect(() => {
    if (!session?.user) return;
    setSidebarNotifications((prev) => {
      // Only seed if counts not yet recorded
      const next = { ...prev };
      if (next["Community"] === undefined) next["Community"] = 3;
      if (next["Products"] === undefined)  next["Products"]  = safeProducts.length > 0 ? Math.min(safeProducts.length, 5) : 0;
      try { localStorage.setItem("pp-sidebar-notifs", JSON.stringify(next)); } catch {}
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user]);

  // Clear notification count for a tab when the user visits it
  useEffect(() => {
    if (!sidebarNotifications[activeTab]) return;
    setSidebarNotifications((prev) => {
      const next = { ...prev, [activeTab]: 0 };
      try { localStorage.setItem("pp-sidebar-notifs", JSON.stringify(next)); } catch {}
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const safeProducts = useMemo(() => {
    return products.filter((p) => {
      const img = p.image_url || p.Image_URL || p.original_image_url;
      return typeof img === 'string' && img.trim().length > 0;
    });
  }, [products]);
  const accessPlan = getAccessPlan(session, profilePlan);
  const productLimit = accessPlan === "pro" ? safeProducts.length : accessPlan === "registered" ? 100 : 12;
  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();
    safeProducts.forEach((product) => {
      const category = String(product.Category || product.category || "").trim();
      if (category) categories.add(category);
    });
    return ["All", ...Array.from(categories).sort((a, b) => a.localeCompare(b)).slice(0, 60)];
  }, [safeProducts]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const min = Number(minPrice);
    const max = Number(maxPrice);

    // TODO: move filtering and pagination to /api/products once product volume grows beyond the current preview set.
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
      const price = getProductPriceNumber(product);

      const platformMatches =
        activePlatform === "All" ||
        platform === "Marketplace" ||
        platform.toLowerCase().includes(activePlatform.toLowerCase());
      const categoryMatches = categoryFilter === "All" || category === categoryFilter;
      const minMatches = !minPrice || (Number.isFinite(min) && price >= min);
      const maxMatches = !maxPrice || (Number.isFinite(max) && price <= max);
      const searchMatches =
        !q.trim() ||
        `${name} ${platform} ${category} ${brand} ${store} ${productUrl}`.toLowerCase().includes(q);

      return platformMatches && categoryMatches && minMatches && maxMatches && searchMatches;
    });
  }, [safeProducts, searchQuery, activePlatform, categoryFilter, minPrice, maxPrice, productLimit]);

  const productStats = useMemo(() => {
    const prices = safeProducts.map(getProductPriceNumber).filter((value) => Number.isFinite(value) && value > 0);
    const sales = safeProducts.map(getProductSalesNumber).filter((value) => Number.isFinite(value) && value >= 0);
    const margins = safeProducts.map(getProductMarginNumber).filter((value) => Number.isFinite(value));
    const revenues = safeProducts.map(getProductRevenueNumber).filter((value) => Number.isFinite(value) && value >= 0);

    return {
      productsTracked: safeProducts.length,
      avgPrice: prices.length ? formatCurrencyNumber(average(prices)) : "Pending",
      avgMargin: margins.length ? `${average(margins).toFixed(1)}%` : "Pending",
      totalSales: sales.length ? Intl.NumberFormat("en-MY").format(sum(sales)) : "Pending",
      totalRevenue: revenues.length ? formatCompactCurrency(sum(revenues)) : "Not enough data",
    };
  }, [safeProducts]);

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
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

  // Check if current user is an admin
  const isAdmin = session?.user?.email === "admin@profitpilot.ai"; // Stub logic for admin check
  const isLoggedIn = !!session?.user;

  return (
    <div className={`theme-shell relative z-10 flex min-h-screen ${comfortTheme ? "comfort-theme" : "dark-theme"}`}>
      <div className="fixed inset-0 -z-10 bg-[var(--background)]">
        <div
          className={`absolute inset-0 ${
            comfortTheme
              ? "bg-[linear-gradient(180deg,#F6FAFC_0%,#EEF6F9_52%,#EAF3F7_100%)]"
              : "bg-[radial-gradient(circle_at_top_left,rgba(0,200,240,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(53,230,255,0.08),transparent_30%),linear-gradient(180deg,#050B16_0%,#071322_48%,#050B16_100%)]"
          }`}
        />
      </div>

      <MobileDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        accessPlan={accessPlan as AccessPlan}
        onLogin={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
      />

      {isLoggedIn ? (
        <AppSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isAdmin={isAdmin}
          accessPlan={accessPlan as AccessPlan}
          onSignOut={handleSignOut}
          notificationCounts={sidebarNotifications}
        />
      ) : null}

      <div className="flex flex-1 flex-col overflow-x-hidden">
        {isLoggedIn ? (
          <AppHeader
            activeTab={activeTab}
            comfortTheme={comfortTheme}
            onToggleTheme={toggleComfortTheme}
            onOpenMobileNav={() => setIsMobileNavOpen(true)}
            session={session}
            accessPlan={accessPlan as AccessPlan}
            setActiveTab={setActiveTab}
            onSignOut={handleSignOut}
          />
        ) : (
          <PublicHeader
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogin={() => setIsAuthOpen(true)}
            onOpenMobileNav={() => setIsMobileNavOpen(true)}
          />
        )}

        {/* Features page: full-width, no constrained padding */}
        {activeTab === "Features" && (
          <FeaturesPage
            onLogin={() => setIsAuthOpen(true)}
            onViewDemo={() => setActiveTab("Products")}
          />
        )}

        <main className={`mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 ${activeTab === "Features" ? "hidden" : ""}`}>
          {(activeTab === "Home" || activeTab === "Dashboard") && <HomeView onExploreProducts={() => setActiveTab("Products")} />}

          {activeTab === "Products" && (
            <section className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Product Radar</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
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

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                <div className="text-sm text-muted-foreground">
                  Use filters to narrow by platform, category, and price.
                </div>
                
                <div className="flex gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="w-full rounded-lg border border-border bg-input py-2 pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-cyan-400"
                    />
                  </div>
                  <button
                    onClick={() => setFiltersOpen((value) => !value)}
                    className="flex items-center gap-2 rounded-lg border border-border bg-input px-4 py-2 text-sm text-muted-foreground transition hover:border-cyan-400"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </button>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActivePlatform("All");
                      setCategoryFilter("All");
                      setMinPrice("");
                      setMaxPrice("");
                    }}
                    className="rounded-lg border border-border bg-input px-4 py-2 text-sm text-muted-foreground transition hover:border-cyan-400"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {filtersOpen && (
                <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-4">
                  <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Platform
                    <select
                      value={activePlatform}
                      onChange={(event) => setActivePlatform(event.target.value)}
                      className="rounded-lg border border-border bg-input px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none"
                    >
                      {["All", "Shopee", "Lazada", "TikTok Shop"].map((platform) => (
                        <option key={platform}>{platform}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Category
                    <select
                      value={categoryFilter}
                      onChange={(event) => setCategoryFilter(event.target.value)}
                      className="rounded-lg border border-border bg-input px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none"
                    >
                      {categoryOptions.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Min price RM
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(event) => setMinPrice(event.target.value)}
                      placeholder="0"
                      className="rounded-lg border border-border bg-input px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none"
                    />
                  </label>
                  <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Max price RM
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(event) => setMaxPrice(event.target.value)}
                      placeholder="100"
                      className="rounded-lg border border-border bg-input px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none"
                    />
                  </label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
                <div className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <PackageSearch className="h-4 w-4 text-cyan-400" />
                    Products Tracked
                  </div>
                  <p className="text-2xl font-bold text-foreground">{productStats.productsTracked}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    Shown Now
                  </div>
                  <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Activity className="h-4 w-4 text-amber-400" />
                    Avg. Margin
                  </div>
                  <p className="text-2xl font-bold text-foreground">{productStats.avgMargin}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <DollarSign className="h-4 w-4 text-indigo-400" />
                    Revenue (Est.)
                  </div>
                  <p className="text-2xl font-bold text-foreground">{productStats.totalRevenue}</p>
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
                      onPreview={(item) => setPreviewProduct(item)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/50 py-16 text-center text-muted-foreground">
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
              <ResearchHub 
                session={session} 
                products={safeProducts} 
                onAnalyzeProduct={(p) => setDrawerProduct(p)}
              />
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
          {activeTab === "Settings" && (
            <AccessGate
              plan={accessPlan}
              required="registered"
              title="Settings"
              description="Configure your intelligence dashboard."
              onLogin={() => setIsAuthOpen(true)}
            >
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                <p>Settings coming soon in a future update.</p>
              </div>
            </AccessGate>
          )}

          {activeTab === "Billing" && (
            <AccessGate
              plan={accessPlan}
              required="registered"
              title="Billing & Payment"
              description="Manage your payment methods and invoice history."
              onLogin={() => setIsAuthOpen(true)}
            >
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                <p>Billing and payment management coming soon.</p>
              </div>
            </AccessGate>
          )}

          {activeTab === "Subscription" && (
            <AccessGate
              plan={accessPlan}
              required="registered"
              title="Subscription Plan"
              description="Manage your SaaS subscription and limits."
              onLogin={() => setIsAuthOpen(true)}
            >
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                <p>Subscription management coming soon.</p>
              </div>
            </AccessGate>
          )}

          {activeTab === "Analytics" && (
            <AccessGate
              plan={accessPlan}
              required="pro"
              title="Advanced Analytics"
              description="Pro users get full access to market analytics and forecasting."
              onLogin={() => setIsAuthOpen(true)}
            >
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                <p>Analytics coming soon in a future update.</p>
              </div>
            </AccessGate>
          )}

          {["AdminDashboard", "DataOps", "ProductQueue", "CommunityApprovals", "AILogs", "UserManagement"].includes(activeTab) && (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <h2 className="text-xl font-bold text-foreground">Admin Portal</h2>
              {isAdmin ? (
                <p className="mt-2 text-muted-foreground">Authorized access confirmed. Module: {activeTab}</p>
              ) : (
                <p className="mt-2 text-red-400">Unauthorized access. This incident will be reported.</p>
              )}
            </div>
          )}
        </main>

        <footer className="border-t border-border/80 px-4 py-6 text-center text-xs text-slate-500">
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
      <ProductSummaryModal
        product={previewProduct}
        onClose={() => setPreviewProduct(null)}
        onAnalyze={(product) => {
          setPreviewProduct(null);
          setDrawerProduct(product);
        }}
      />
      <AuthPanel
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSessionChange={updateSession}
      />
    </div>
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

function getProductPriceNumber(product: any) {
  const value = product?.price ?? product?.Price_RM ?? product?.Final_Price_Low ?? product?.Initial_Price_Low;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getProductSalesNumber(product: any) {
  const value = product?.sales ?? product?.Sales;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getProductRevenueNumber(product: any) {
  const value = product?.revenue_calc ?? product?.Revenue_Calc ?? product?.revenue ?? product?.Revenue;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function getProductMarginNumber(product: any) {
  const value = product?.net_margin_calc ?? product?.Net_Margin_Calc ?? product?.margin ?? product?.Margin;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function average(values: number[]) {
  return values.length ? sum(values) / values.length : 0;
}

function formatCurrencyNumber(value: number) {
  if (!Number.isFinite(value)) return "Pending";
  return `RM ${value.toFixed(2)}`;
}

function formatCompactCurrency(value: number) {
  if (!Number.isFinite(value)) return "Not enough data";
  return `RM ${Intl.NumberFormat("en-MY", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)}`;
}

function ProductSummaryModal({
  product,
  onClose,
  onAnalyze,
}: {
  product: any | null;
  onClose: () => void;
  onAnalyze: (product: any) => void;
}) {
  if (!product) return null;

  const name = getDisplayProductName(product);
  const category = product.Category || product.category || "Uncategorized";
  const price = getDisplayProductPrice(product);
  const sales = product.Sales || product.sales || "N/A";
  const rank = getDisplayProductRank(product);
  const imageUrl = product.Image_URL || product.image_url;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Product summary</p>
            <h2 className="mt-2 text-xl font-bold leading-tight text-foreground">{name}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg bg-muted/50 p-2 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-[220px_1fr]">
          <div className="h-52 overflow-hidden rounded-lg border border-border bg-muted/50">
            {imageUrl ? (
              <div className="relative h-full w-full"><Image src={imageUrl} alt={name} fill unoptimized referrerPolicy="no-referrer" className="object-cover" /></div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No image</div>
            )}
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <SummaryMetric label="Category" value={String(category)} />
              <SummaryMetric label="Rank" value={`#${rank}`} />
              <SummaryMetric label="Price" value={`RM ${price}`} />
              <SummaryMetric label="Sales" value={String(sales)} />
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              This product is grouped under {category}. Use the full analysis view to inspect trend strength,
              sourcing fit, margin assumptions, and marketplace links.
            </p>
            <button
              onClick={() => onAnalyze(product)}
              className="w-full rounded-lg bg-cyan-500 px-5 py-3 text-sm font-bold text-foreground transition hover:bg-cyan-300"
            >
              Analyze product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-3">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}
