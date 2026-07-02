"use client";

import { useMemo, useState } from "react";
import { Activity, Beaker, DollarSign, Filter, Home, PackageSearch, Search, TrendingUp, Truck, User, Users } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductDrawer from "@/components/ProductDrawer";
import HomeView from "@/components/HomeView";
import CommunityHub from "@/components/CommunityHub";
import ResearchHub from "@/components/ResearchHub";
import SourcingIntelligence from "@/components/SourcingIntelligence";
import UserDashboard from "@/components/UserDashboard";

const LOGO_URL = "/profit-pilot-logo.png";

export default function Dashboard({ initialProducts }: { initialProducts: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerProduct, setDrawerProduct] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("Home");
  const [activePlatform, setActivePlatform] = useState("All");

  const safeProducts = Array.isArray(initialProducts) ? initialProducts : [];

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();

    return safeProducts.filter((product) => {
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
  }, [safeProducts, searchQuery, activePlatform]);

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
      <div className="fixed inset-0 -z-10 bg-[#050816]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_30%),linear-gradient(180deg,#050816_0%,#08111f_45%,#050816_100%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 border-b border-cyan-400/10 bg-[#070b16]/88 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex min-h-16 items-center justify-between gap-4 py-3">
              <button onClick={() => setActiveTab("Home")} className="flex shrink-0 items-center gap-3 text-left">
                <img src={LOGO_URL} alt="Profit Pilot AI" className="h-10 w-10 object-contain" />
                <span className="hidden text-xl font-bold tracking-tight text-white sm:block">
                  Profit Pilot AI
                </span>
              </button>

              <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
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

              <div className="hidden shrink-0 sm:block">
                <button className="rounded-full border border-cyan-400/30 bg-transparent px-5 py-2 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400/10">
                  Login / Sign Up
                </button>
              </div>
            </div>

            <nav className="flex gap-2 overflow-x-auto pb-3 md:hidden">
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
                    {safeProducts.length > 0
                      ? `${safeProducts.length} Supabase products loaded from MYProductScout_Master.`
                      : "No Supabase products loaded yet."}
                  </p>
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

          {activeTab === "Research" && <ResearchHub />}
          {activeTab === "Sourcing" && <SourcingIntelligence />}
          {activeTab === "Community" && <CommunityHub />}
          {activeTab === "Profile" && <UserDashboard />}
        </main>
      </div>

      <ProductDrawer
        product={drawerProduct}
        onClose={() => setDrawerProduct(null)}
        onResearch={() => {
          setDrawerProduct(null);
          setActiveTab("Research");
        }}
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
