import {
  Activity,
  Beaker,
  CreditCard,
  Database,
  Globe2,
  Home,
  LayoutDashboard,
  LineChart,
  PackageSearch,
  Settings,
  ShieldAlert,
  TerminalSquare,
  Truck,
  UserCheck,
  User,
  Users,
} from "lucide-react";

export type NavItem = {
  label: string;
  id: string; // Used as the activeTab state (or href)
  icon?: any;
  badge?: string;
  locked?: boolean;
};

// 1. Public Website Header
export const publicNavItems: NavItem[] = [
  { label: "Home", id: "Home" },
  { label: "Features", id: "Features" },
  { label: "Product Intelligence", id: "Products" },
  { label: "Research Hub", id: "Research" },
  { label: "Sourcing", id: "Sourcing" },
  { label: "Community", id: "Community" },
  { label: "Pricing", id: "Pricing" },
];

// 2. Authenticated App Shell (Sidebar)
export const appNavItems: NavItem[] = [
  { label: "Dashboard", id: "Dashboard", icon: LayoutDashboard },
  { label: "Products", id: "Products", icon: PackageSearch },
  { label: "Research Hub", id: "Research", icon: Beaker },
  { label: "Sourcing", id: "Sourcing", icon: Truck },
  { label: "Community", id: "Community", icon: Users },
  { label: "User Account", id: "Profile", icon: User },
  { label: "Analytics", id: "Analytics", icon: LineChart, locked: true },
  { label: "Settings", id: "Settings", icon: Settings },
];

// 3. Admin Navigation
export const adminNavItems: NavItem[] = [
  { label: "Admin Dashboard", id: "AdminDashboard", icon: ShieldAlert },
  { label: "Data Operations", id: "DataOps", icon: Database },
  { label: "Product Queue", id: "ProductQueue", icon: UserCheck },
  { label: "Community Approvals", id: "CommunityApprovals", icon: Globe2 },
  { label: "AI Logs", id: "AILogs", icon: TerminalSquare },
  { label: "User Management", id: "UserManagement", icon: Activity },
];
