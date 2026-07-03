"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, BrainCircuit, DatabaseZap, LayoutDashboard, MessageSquareText, Shield, Sparkles } from "lucide-react";

const navItems = [
  { href: "/ops/dashboard", label: "Health Monitor", icon: LayoutDashboard },
  { href: "/ops/scraper", label: "Scraper Bot", icon: Bot },
  { href: "/ops/research-bot", label: "Research Bot", icon: BrainCircuit },
  { href: "/ops/cleaner-bot", label: "Data Cleaner", icon: DatabaseZap },
  { href: "/ops/chatbot", label: "Chatbot Ops", icon: MessageSquareText },
];

export default function OpsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="theme-shell dark-theme min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(0,200,240,0.12),transparent_34%),linear-gradient(180deg,#050B16_0%,#071322_52%,#050B16_100%)]" />
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-slate-800 bg-[#071221]/95 p-5 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <Link href="/" className="flex items-center gap-3">
            <img src="/profit-pilot-logo.png" alt="Profit Pilot AI" className="h-10 w-10 object-contain" />
            <div>
              <p className="text-sm font-bold text-white">Profit Pilot AI</p>
              <p className="text-xs text-cyan-300">Operations Backend</p>
            </div>
          </Link>

          <div className="mt-6 rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4">
            <div className="flex items-center gap-2 text-cyan-300">
              <Shield className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-[0.16em]">Hidden console</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              This environment is not linked in the public frontend. Use direct ops URLs only.
            </p>
          </div>

          <nav className="mt-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                    active
                      ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-xl border border-slate-800 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-slate-300">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <span className="text-sm font-bold">Next hardening</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Add admin-token middleware before production operator access.
            </p>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
