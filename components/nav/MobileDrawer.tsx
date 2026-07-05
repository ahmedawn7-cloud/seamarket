import { useEffect } from "react";
import Image from "next/image";
import { LogOut, X } from "lucide-react";
import { publicNavItems, appNavItems, adminNavItems } from "./nav-config";
import type { AccessPlan } from "@/components/AuthPanel";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  isAdmin: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  accessPlan: AccessPlan;
  onLogin: () => void;
  onSignOut: () => void;
}

const LOGO_URL = "/profit-pilot-logo.png";

export default function MobileDrawer({
  isOpen,
  onClose,
  isLoggedIn,
  isAdmin,
  activeTab,
  setActiveTab,
  accessPlan,
  onLogin,
  onSignOut,
}: MobileDrawerProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-3/4 max-w-sm border-r border-border bg-card shadow-2xl transition-transform">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <div className="flex items-center gap-3">
              <Image src={LOGO_URL} alt="Logo" width={24} height={24} className="h-6 w-6 object-contain" />
              <span className="font-bold text-foreground">Profit Pilot AI</span>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            {isLoggedIn ? (
              <nav className="space-y-1">
                {appNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (!item.locked) {
                          setActiveTab(item.id);
                          onClose();
                        }
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                        activeTab === item.id
                          ? "bg-cyan-500/10 text-cyan-400"
                          : item.locked
                          ? "opacity-50 cursor-not-allowed text-muted-foreground"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      {Icon && <Icon className="h-4 w-4 shrink-0" />}
                      <span>{item.label}</span>
                      {item.locked && (
                        <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                          Beta
                        </span>
                      )}
                    </button>
                  );
                })}
                
                {isAdmin && (
                  <>
                    <div className="mt-6 mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Admin
                    </div>
                    {adminNavItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            onClose();
                          }}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                            activeTab === item.id
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
            ) : (
              <nav className="space-y-1">
                {publicNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      onClose();
                    }}
                    className={`flex w-full items-center px-3 py-3 text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? "text-cyan-400 font-bold"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            )}
          </div>

          <div className="border-t border-border p-4">
            {isLoggedIn ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 px-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
                    {accessPlan === "pro" ? "PRO" : "REG"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {accessPlan === "pro" ? "Pro Plan" : "Registered User"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onSignOut();
                    onClose();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    onLogin();
                    onClose();
                  }}
                  className="w-full rounded-lg border border-border bg-card py-2 text-sm font-bold text-muted-foreground hover:text-foreground"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    onLogin();
                    onClose();
                  }}
                  className="w-full rounded-lg bg-cyan-500 py-2 text-sm font-bold text-background hover:bg-cyan-400"
                >
                  Start Free
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
