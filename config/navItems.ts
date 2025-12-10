import {
  LayoutDashboard,
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
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
  { href: "/app/metrics", label: "Metrics", icon: BarChart3 },
  { href: "/app/revenue", label: "Revenue", icon: TrendingUp },
  { href: "/app/expenses", label: "Expenses", icon: TrendingDown },
  { href: "/app/pricing", label: "Pricing", icon: DollarSign },
];
