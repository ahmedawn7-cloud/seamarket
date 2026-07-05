import Image from "next/image";
import { Menu } from "lucide-react";
import { publicNavItems } from "./nav-config";

interface PublicHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogin: () => void;
  onOpenMobileNav: () => void;
}

const LOGO_URL = "/profit-pilot-logo.png";

export default function PublicHeader({
  activeTab,
  setActiveTab,
  onLogin,
  onOpenMobileNav,
}: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <button
            onClick={() => setActiveTab("Home")}
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <Image
              src={LOGO_URL}
              alt="Profit Pilot AI"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <span className="text-xl font-bold tracking-tight text-foreground">
              Profit Pilot AI
            </span>
          </button>

          <nav className="hidden items-center gap-6 lg:flex">
            {publicNavItems.filter(item => item.id !== "Home").map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 sm:flex">
            <button
              onClick={() => setActiveTab("Products")}
              className="rounded-full border border-border bg-transparent px-5 py-2 text-sm font-bold text-foreground transition-colors hover:bg-muted"
            >
              View Demo
            </button>
            <button
              onClick={onLogin}
              className="text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              Login
            </button>
            <button
              onClick={onLogin}
              className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-bold text-background transition-transform hover:scale-105 hover:bg-cyan-400"
            >
              Start Free &rarr;
            </button>
          </div>
          <button
            onClick={onOpenMobileNav}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
