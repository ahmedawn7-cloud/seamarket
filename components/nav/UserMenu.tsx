"use client";

import { useState, useRef, useEffect } from "react";
import { User, Settings, CreditCard, Sparkles, Bookmark, LogOut } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import type { AccessPlan } from "@/components/AuthPanel";

interface UserMenuProps {
  session: Session | null;
  accessPlan: AccessPlan;
  setActiveTab: (tab: string) => void;
  onSignOut: () => void;
}

export default function UserMenu({ session, accessPlan, setActiveTab, onSignOut }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const email = session?.user?.email || "User";
  const initial = email.charAt(0).toUpperCase();

  const handleSelect = (tab: string) => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-400 border border-cyan-500/30 transition hover:bg-cyan-500/30"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {initial}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-1 shadow-2xl shadow-black/40 z-50">
          <div className="px-3 py-3 border-b border-border/50 mb-1">
            <p className="text-sm font-bold text-foreground truncate">{email}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-[0.14em] mt-0.5">
              {accessPlan} PLAN
            </p>
          </div>

          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => handleSelect("Profile")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-cyan-400"
            >
              <User className="h-4 w-4" />
              View Profile
            </button>
            <button
              onClick={() => handleSelect("Settings")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-cyan-400"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              onClick={() => handleSelect("Billing")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-cyan-400"
            >
              <CreditCard className="h-4 w-4" />
              Billing / Payment
            </button>
            <button
              onClick={() => handleSelect("Subscription")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-cyan-400"
            >
              <Sparkles className="h-4 w-4" />
              Subscription / Plan
            </button>
            <button
              onClick={() => handleSelect("Products")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted/50 hover:text-cyan-400"
            >
              <Bookmark className="h-4 w-4" />
              Saved Products
            </button>
          </div>

          <div className="mt-1 border-t border-border/50 pt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
