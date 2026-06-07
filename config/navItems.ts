import {
  LayoutDashboard,
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Settings2,
  GitCompareArrows,
  ClipboardCheck,
  Timer,
  Users,
  LucideIcon,
} from "lucide-react";
import { LAUNCH_V1 } from "./launch";

export interface NavItem {
  href: string;
  label: string;
  icon?: LucideIcon;
  children?: NavItem[];
}

/**
 * Centralized navigation configuration
 * Used by Sidebar and any other navigation components
 */
export const navItems: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/assumptions", label: "Assumptions", icon: Settings2 },
  {
    href: "/app/metrics",
    label: "Metrics",
    icon: BarChart3,
    children: [
      { href: "/app/metrics/saas", label: "SaaS Metrics" },
      { href: "/app/metrics/financial", label: "Financial Metrics" },
    ],
  },
  { href: "/app/revenue", label: "Revenue", icon: TrendingUp },
  {
    href: "/app/expenses",
    label: "Expenses",
    icon: TrendingDown,
    children: [
      { href: "/app/expenses/people", label: "People Costs" },
      { href: "/app/expenses/non-people", label: "Non-People Costs" },
    ],
  },
  ...(LAUNCH_V1.actuals
    ? [{ href: "/app/actuals", label: "Actuals", icon: ClipboardCheck }]
    : []),
  { href: "/app/scenarios", label: "Scenarios", icon: GitCompareArrows },
  { href: "/app/runway", label: "Runway", icon: Timer },
  { href: "/app/settings/billing", label: "Billing", icon: DollarSign },
  ...(LAUNCH_V1.team
    ? [{ href: "/app/settings/team", label: "Team", icon: Users }]
    : []),
];
