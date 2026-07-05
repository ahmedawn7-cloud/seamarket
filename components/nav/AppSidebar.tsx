import Image from "next/image";
import { LogOut } from "lucide-react";
import { appNavItems, adminNavItems } from "./nav-config";
import type { AccessPlan } from "@/components/AuthPanel";

interface AppSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
  accessPlan: AccessPlan;
  onSignOut: () => void;
  notificationCounts?: Record<string, number>;
}

const LOGO_URL = "/profit-pilot-logo.png";

export default function AppSidebar({
  activeTab,
  setActiveTab,
  isAdmin,
  accessPlan,
  onSignOut,
  notificationCounts = {},
}: AppSidebarProps) {
  return (
    <aside className="hidden w-64 flex-col border-r border-border bg-card lg:flex">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-3 px-6">
        <Image
          src={LOGO_URL}
          alt="Profit Pilot AI"
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
        />
        <span className="text-lg font-bold tracking-tight text-foreground">
          Profit Pilot AI
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6 scrollbar-hide">
        <nav className="flex-1 space-y-1">
          {appNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const count = notificationCounts[item.id] ?? 0;
            return (
              <button
                key={item.id}
                onClick={() => !item.locked && setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400"
                    : item.locked
                    ? "opacity-50 cursor-not-allowed text-muted-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span>{item.label}</span>
                {/* Notification badge */}
                {count > 0 && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cyan-500 px-1.5 text-[10px] font-bold text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
                {/* Beta badge (only if no notif count) */}
                {item.locked && count === 0 && (
                  <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                    Beta
                  </span>
                )}
              </button>
            );
          })}

          {isAdmin && (
            <>
              <div className="mt-8 mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                Admin
              </div>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-purple-500/10 text-purple-400"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </>
          )}
        </nav>

        {/* User Status Bottom */}
        <div className="mt-auto pt-6">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
                {accessPlan === "pro" ? "PRO" : "REG"}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-bold text-foreground">
                  {accessPlan === "pro" ? "Pro Plan" : "Registered User"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {accessPlan === "pro" ? "Your plan is active" : "Upgrade for more limits"}
                </p>
              </div>
            </div>
            {accessPlan !== "pro" && (
              <button 
                onClick={() => setActiveTab("Pricing")}
                className="mt-4 w-full rounded-lg border border-cyan-400/30 bg-cyan-400/10 py-1.5 text-xs font-bold text-cyan-300 transition-colors hover:bg-cyan-400/20"
              >
                Upgrade Plan
              </button>
            )}
            <button
              onClick={onSignOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
