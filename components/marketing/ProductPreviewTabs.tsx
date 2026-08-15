"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Reveal } from "./Reveal";
import {
  TrendingUp,
  Wallet,
  Timer,
  BarChart3,
  Layers,
  type LucideIcon,
} from "lucide-react";

type Tab = {
  id: string;
  label: string;
  icon: LucideIcon;
  route: string;
  caption: string;
  render: () => React.ReactNode;
};

const tabs: Tab[] = [
  {
    id: "revenue",
    label: "Revenue",
    icon: TrendingUp,
    route: "app.burnlytics.com/app/revenue",
    caption:
      "Model PLG, sales-led, and partner motions side by side — MRR updates as you type.",
    render: RevenuePreview,
  },
  {
    id: "expenses",
    label: "Hiring & expenses",
    icon: Wallet,
    route: "app.burnlytics.com/app/expenses",
    caption:
      "Plan headcount, tools, and overhead. Every line item flows straight into your burn.",
    render: ExpensesPreview,
  },
  {
    id: "runway",
    label: "Runway",
    icon: Timer,
    route: "app.burnlytics.com/app/runway",
    caption:
      "See exactly when you run out of cash — and how each decision moves the date.",
    render: RunwayPreview,
  },
  {
    id: "metrics",
    label: "Investor metrics",
    icon: BarChart3,
    route: "app.burnlytics.com/app/metrics",
    caption:
      "Board-ready SaaS metrics — LTV/CAC, Rule of 40, Burn Multiple — always current.",
    render: MetricsPreview,
  },
  {
    id: "scenarios",
    label: "Scenarios",
    icon: Layers,
    route: "app.burnlytics.com/app/scenarios",
    caption:
      "Compare Base, Conservative, and Aggressive plans in one view before you commit.",
    render: ScenariosPreview,
  },
];

export function ProductPreviewTabs() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const prefersReducedMotion = useReducedMotion();
  const active = tabs.find((t) => t.id === activeTab)!;

  return (
    <section className="relative py-10 md:py-12 lg:py-14">
      <div className="absolute inset-0 bg-neutral-50/50" />

      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="text-center">
            <p className="text-[12px] font-medium uppercase tracking-wider text-neutral-500">
              Product tour
            </p>
            <h2 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-neutral-900 md:text-[2rem]">
              Take a look inside
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-neutral-600">
              Switch between tabs to preview each part of the product — the same
              views you&apos;ll use to plan your runway.
            </p>
          </div>
        </Reveal>

        {/* Tabs */}
        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-neutral-900 text-white"
                    : "border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Browser frame */}
        <Reveal delay={0.2}>
          <div className="relative mx-auto mt-8 max-w-5xl">
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg shadow-neutral-900/5">
              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                </div>
                <div className="ml-4 flex h-6 flex-1 items-center justify-center rounded-md bg-neutral-100 px-3">
                  <span className="text-[11px] text-neutral-400">
                    {active.route}
                  </span>
                </div>
              </div>

              {/* Preview body */}
              <div className="bg-neutral-50 p-6 md:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={
                      prefersReducedMotion
                        ? { opacity: 1 }
                        : { opacity: 0, y: 8 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: -8 }
                    }
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    {active.render()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Subtle glow */}
            <div className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-b from-neutral-200/30 to-transparent blur-2xl" />
          </div>
        </Reveal>

        {/* Caption */}
        <Reveal delay={0.25}>
          <p className="mx-auto mt-6 max-w-2xl text-center text-[13px] text-neutral-500">
            {active.caption}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Shared preview building blocks ---------- */

function MetricCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3">
      <p className="text-[11px] text-neutral-500">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-lg font-semibold text-neutral-900">{value}</span>
        {trend && (
          <span
            className={`text-[11px] font-medium ${
              trend.startsWith("-") ? "text-red-500" : "text-emerald-600"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function BarChart({
  heights,
  labels,
}: {
  heights: number[];
  labels: [string, string, string];
}) {
  return (
    <>
      <div className="flex h-32 items-end gap-1 md:h-40">
        {heights.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-neutral-200"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-neutral-400">
        <span>{labels[0]}</span>
        <span>{labels[1]}</span>
        <span>{labels[2]}</span>
      </div>
    </>
  );
}

function TableRow({
  label,
  values,
  highlight = false,
}: {
  label: string;
  values: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-4 gap-4 px-4 py-2.5 text-[12px] ${
        highlight ? "bg-neutral-50 font-medium" : ""
      }`}
    >
      <span className="text-neutral-600">{label}</span>
      {values.map((v, i) => (
        <span
          key={i}
          className={`text-right tabular-nums ${
            highlight ? "text-neutral-900" : "text-neutral-500"
          }`}
        >
          {v}
        </span>
      ))}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-neutral-100 px-4 py-3">
      <span className="text-[13px] font-medium text-neutral-900">
        {children}
      </span>
    </div>
  );
}

/* ---------- Per-tab previews ---------- */

function RevenuePreview() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <MetricCard label="Ending MRR" value="€26.0K" trend="+18%" />
        <MetricCard label="New MRR / mo" value="€3.9K" trend="+12%" />
        <MetricCard label="Paying customers" value="184" trend="+27" />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[13px] font-medium text-neutral-900">
            MRR by revenue stream
          </span>
          <div className="flex gap-3">
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              <span className="h-2 w-2 rounded-full bg-neutral-400" />
              PLG
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              <span className="h-2 w-2 rounded-full bg-neutral-300" />
              Sales
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              <span className="h-2 w-2 rounded-full bg-neutral-200" />
              Partners
            </span>
          </div>
        </div>
        <BarChart
          heights={[38, 44, 49, 55, 60, 66, 71, 78, 84, 89, 95, 100]}
          labels={["Jan", "Jun", "Dec"]}
        />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <CardTitle>Revenue assumptions</CardTitle>
        <div className="divide-y divide-neutral-100">
          <TableRow label="PLG signups → paid" values={["3.2%", "4.0%", "4.5%"]} />
          <TableRow label="Sales wins / mo" values={["4", "6", "8"]} />
          <TableRow label="Partner-sourced MRR" values={["€2K", "€3K", "€4K"]} />
          <TableRow label="Blended MRR" values={["€21K", "€24K", "€26K"]} highlight />
        </div>
      </div>
    </div>
  );
}

function ExpensesPreview() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Headcount" value="12" trend="+3" />
        <MetricCard label="Payroll / mo" value="€35K" trend="+9%" />
        <MetricCard label="Tools & services" value="€8.4K" />
        <MetricCard label="Total spend" value="€48.9K" trend="+7%" />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <CardTitle>Hiring plan</CardTitle>
        <div className="divide-y divide-neutral-100">
          <TableRow label="Engineering (5)" values={["€18K", "€20K", "€22K"]} />
          <TableRow label="Go-to-market (4)" values={["€11K", "€12K", "€13K"]} />
          <TableRow label="Ops & G&A (3)" values={["€6K", "€6K", "€7K"]} />
          <TableRow label="Total payroll" values={["€35K", "€38K", "€42K"]} highlight />
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <CardTitle>Non-people expenses</CardTitle>
        <div className="divide-y divide-neutral-100">
          <TableRow label="Software & tools" values={["€3.1K", "€3.3K", "€3.6K"]} />
          <TableRow label="Marketing" values={["€4.0K", "€4.5K", "€5.0K"]} />
          <TableRow label="Office & overhead" values={["€1.3K", "€1.3K", "€1.4K"]} />
        </div>
      </div>
    </div>
  );
}

function RunwayPreview() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Cash balance" value="€774K" />
        <MetricCard label="Monthly burn" value="€42.5K" trend="-8%" />
        <MetricCard label="Runway" value="18.2 mo" trend="+2.1" />
        <MetricCard label="Cash-out" value="Feb '28" />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[13px] font-medium text-neutral-900">
            Projected cash balance
          </span>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
            24-month view
          </span>
        </div>
        <BarChart
          heights={[100, 94, 88, 82, 76, 70, 64, 58, 52, 45, 38, 30]}
          labels={["Now", "Month 12", "Month 24"]}
        />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <CardTitle>Monthly cash flow</CardTitle>
        <div className="divide-y divide-neutral-100">
          <TableRow label="Revenue" values={["€26K", "€29K", "€32K"]} />
          <TableRow label="Total spend" values={["€49K", "€51K", "€54K"]} />
          <TableRow label="Net burn" values={["€-23K", "€-22K", "€-22K"]} highlight />
        </div>
      </div>
    </div>
  );
}

function MetricsPreview() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <MetricCard label="LTV / CAC" value="3.8x" trend="+0.4" />
        <MetricCard label="CAC payback" value="11 mo" trend="-2" />
        <MetricCard label="Net revenue retention" value="112%" trend="+4%" />
        <MetricCard label="Burn multiple" value="1.6x" trend="-0.3" />
        <MetricCard label="Rule of 40" value="47%" trend="+6" />
        <MetricCard label="Gross margin" value="82%" trend="+1%" />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[13px] font-medium text-neutral-900">
            ARR growth vs. burn
          </span>
          <div className="flex gap-3">
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              <span className="h-2 w-2 rounded-full bg-neutral-400" />
              ARR
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              <span className="h-2 w-2 rounded-full bg-neutral-200" />
              Burn
            </span>
          </div>
        </div>
        <BarChart
          heights={[40, 46, 52, 57, 63, 68, 74, 80, 86, 91, 96, 100]}
          labels={["Q1", "Q2", "Q4"]}
        />
      </div>
    </div>
  );
}

function ScenariosPreview() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <ScenarioCard
          name="Base"
          runway="14.0 mo"
          arr="€312K"
          accent="bg-neutral-900"
        />
        <ScenarioCard
          name="Conservative"
          runway="18.4 mo"
          arr="€248K"
          accent="bg-neutral-500"
        />
        <ScenarioCard
          name="Aggressive"
          runway="9.6 mo"
          arr="€430K"
          accent="bg-neutral-300"
        />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[13px] font-medium text-neutral-900">
            Cash balance by scenario
          </span>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
            3 scenarios
          </span>
        </div>
        <BarChart
          heights={[100, 90, 80, 71, 62, 54, 46, 39, 32, 26, 20, 14]}
          labels={["Now", "Month 12", "Month 24"]}
        />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <CardTitle>Scenario comparison</CardTitle>
        <div className="divide-y divide-neutral-100">
          <TableRow label="Ending ARR" values={["€312K", "€248K", "€430K"]} />
          <TableRow label="Monthly burn" values={["€42K", "€36K", "€61K"]} />
          <TableRow label="Runway" values={["14.0mo", "18.4mo", "9.6mo"]} highlight />
        </div>
      </div>
    </div>
  );
}

function ScenarioCard({
  name,
  runway,
  arr,
  accent,
}: {
  name: string;
  runway: string;
  arr: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${accent}`} />
        <span className="text-[13px] font-medium text-neutral-900">{name}</span>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] text-neutral-500">Runway</span>
          <span className="text-[13px] font-semibold tabular-nums text-neutral-900">
            {runway}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] text-neutral-500">Ending ARR</span>
          <span className="text-[13px] font-semibold tabular-nums text-neutral-900">
            {arr}
          </span>
        </div>
      </div>
    </div>
  );
}
