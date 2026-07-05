import { Menu, Search, Sun } from "lucide-react";
import { appNavItems, adminNavItems } from "./nav-config";
import UserMenu from "./UserMenu";
import NotificationDropdown from "./NotificationDropdown";
import type { Session } from "@supabase/supabase-js";
import type { AccessPlan } from "@/components/AuthPanel";

interface AppHeaderProps {
  activeTab: string;
  comfortTheme: boolean;
  onToggleTheme: () => void;
  onOpenMobileNav: () => void;
  session?: Session | null;
  accessPlan?: AccessPlan;
  setActiveTab?: (tab: string) => void;
  onSignOut?: () => void;
}

export default function AppHeader({
  activeTab,
  comfortTheme,
  onToggleTheme,
  onOpenMobileNav,
  session = null,
  accessPlan = "guest",
  setActiveTab = () => {},
  onSignOut = () => {},
}: AppHeaderProps) {
  // Find current tab label
  const currentTabInfo =
    appNavItems.find((t) => t.id === activeTab) ||
    adminNavItems.find((t) => t.id === activeTab);
  
  const pageTitle = currentTabInfo ? currentTabInfo.label : activeTab;

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:gap-6 sm:px-6 lg:px-8">
      {/* Mobile Trigger */}
      <button
        onClick={onOpenMobileNav}
        className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page Title */}
      <div className="flex-1 lg:flex-none lg:w-64">
        <h1 className="text-lg font-bold text-foreground sm:text-xl">
          {pageTitle}
        </h1>
      </div>

      {/* Search Bar - hidden on small mobile */}
      <div className="hidden flex-1 items-center px-4 md:flex">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products, categories, brands..."
            className="h-10 w-full rounded-full border border-border bg-muted/50 pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-cyan-400 focus:bg-card"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-4 ml-auto">
        <button
          onClick={onToggleTheme}
          className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          title={comfortTheme ? "Switch to dark theme" : "Switch to light theme"}
        >
          <Sun className="h-5 w-5" />
        </button>
        
        <NotificationDropdown />

        <UserMenu 
          session={session} 
          accessPlan={accessPlan} 
          setActiveTab={setActiveTab} 
          onSignOut={onSignOut} 
        />
      </div>
    </header>
  );
}
