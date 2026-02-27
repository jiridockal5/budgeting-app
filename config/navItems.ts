import {
  LayoutDashboard,
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Settings2,
  GitCompareArrows,
  Timer,
  Users,
  LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Centralized navigation configuration
 * Used by Sidebar and any other navigation components
 */
export const navItems: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/assumptions", label: "Assumptions", icon: Settings2 },
  { href: "/app/metrics", label: "Metrics", icon: BarChart3 },
  { href: "/app/revenue", label: "Revenue", icon: TrendingUp },
  { href: "/app/expenses", label: "Expenses", icon: TrendingDown },
  { href: "/app/scenarios", label: "Scenarios", icon: GitCompareArrows },
  { href: "/app/runway", label: "Runway", icon: Timer },
  { href: "/app/settings/billing", label: "Billing", icon: DollarSign },
  { href: "/app/settings/team", label: "Team", icon: Users },
];
