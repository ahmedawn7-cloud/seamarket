"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Sparkles, MessageSquare, PackagePlus } from "lucide-react";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(true); // Default true to prevent hydration mismatch, set in effect
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if the user has seen the welcome notification
    const seen = localStorage.getItem("profitpilot-welcome-seen");
    if (!seen) {
      setHasSeenWelcome(false);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!hasSeenWelcome) {
      setHasSeenWelcome(true);
      localStorage.setItem("profitpilot-welcome-seen", "true");
    }
  };

  const hasUnread = !hasSeenWelcome;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleOpen}
        className={`relative rounded-full p-2 transition hover:bg-muted ${hasUnread ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {hasUnread && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card shadow-2xl shadow-black/40 z-50 overflow-hidden flex flex-col max-h-[400px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
            <h3 className="font-bold text-foreground">Notifications</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-1">
            <button className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Welcome to Profit Pilot AI!</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  Your intelligence dashboard is ready. Explore the product radar or check out the community hub.
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">System • Just now</p>
              </div>
            </button>

            <button className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <PackagePlus className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">New trending products found</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  AI has identified 12 new high-margin products in the Home & Living category.
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">Alert System • 2 hours ago</p>
              </div>
            </button>

            <button className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">New community strategy</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  "How I scaled TikTok Shop logistics" was just posted in the operators group.
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">Community • 1 day ago</p>
              </div>
            </button>
          </div>
          
          <div className="border-t border-border/50 p-2">
            <button className="w-full rounded-md py-1.5 text-xs font-bold text-cyan-400 transition hover:bg-cyan-500/10">
              Mark all as read
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
