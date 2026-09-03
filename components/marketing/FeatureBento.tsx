"use client";

import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import {
  Layers,
  Zap,
  TrendingUp,
  Users,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { TurquoiseIconBadge } from "./TurquoiseGlow";

const features = [
  {
    id: "scenarios",
    title: "Scenario planning",
    description:
      "Compare Base / Conservative / Aggressive in one view. See how each path affects your runway.",
    chips: ["Runway", "Planning"],
    icon: Layers,
    span: "md:col-span-2",
    visual: "runway" as const,
  },
  {
    id: "setup",
    title: "Fast setup",
    description:
      "Start with a few numbers; expand as you learn. No templates, no complexity upfront.",
    chips: ["Onboarding"],
    icon: Zap,
    span: "md:col-span-1",
    visual: null,
  },
  {
    id: "revenue",
    title: "Revenue modeling",
    description:
      "PLG, Sales-led, or partner motions. Keep it lightweight or go deep — your choice.",
    chips: ["Revenue", "Growth"],
    icon: TrendingUp,
    span: "md:col-span-1",
    visual: null,
  },
  {
    id: "hiring",
    title: "Hiring & expenses",
    description:
      "Headcount plan, tools, services, and overhead. All in one place, all reflected in your burn.",
    chips: ["Headcount", "Costs"],
    icon: Users,
    span: "md:col-span-2",
    visual: null,
  },
  {
    id: "metrics",
    title: "Investor metrics",
    description:
      "CAC Payback, LTV/CAC, NRR/GRR, Burn Multiple, Rule of 40, and more. Always ready for board decks.",
    chips: ["Metrics", "Fundraising"],
    icon: BarChart3,
    span: "md:col-span-1",
    visual: null,
  },
  {
    id: "realtime",
    title: "Always up to date",
    description:
      "Change one assumption and the full model updates instantly. No manual recalculation.",
    chips: ["Real-time"],
    icon: RefreshCw,
    span: "md:col-span-2",
    visual: null,
  },
];

const RUNWAY_BARS = [
  { name: "Conservative", months: 18, width: "100%" },
  { name: "Base", months: 14, width: "78%" },
  { name: "Aggressive", months: 10, width: "56%" },
];

function ScenarioRunwayBars() {
  return (
    <div className="mt-5 space-y-2.5" aria-hidden="true">
      {RUNWAY_BARS.map((row) => (
        <div key={row.name}>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-neutral-500">{row.name}</span>
            <span className="font-medium tabular-nums text-neutral-700">
              {row.months} mo
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-turquoise-400"
              style={{ width: row.width }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FeatureBento() {
  return (
    <section className="relative py-8 md:py-10 lg:py-12">
      <div className="pointer-events-none absolute inset-0 bg-neutral-50/50" />

      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="text-center">
            <p className="text-[12px] font-medium uppercase tracking-wider text-neutral-500">
              Features
            </p>
            <h2 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-neutral-900 md:text-[2rem]">
              Everything you need to plan your runway
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-neutral-600">
              Simple inputs, powerful outputs. Focus on decisions, not spreadsheet formulas.
            </p>
          </div>
        </Reveal>

        <RevealGroup className="mt-10 grid gap-4 md:grid-cols-3 md:gap-4">
          {features.map((feature) => (
            <RevealItem key={feature.id} className={feature.span}>
              <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-300 md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <TurquoiseIconBadge>
                    <feature.icon className="h-5 w-5" />
                  </TurquoiseIconBadge>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {feature.chips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-neutral-200 px-2 py-0.5 text-[10px] font-medium text-neutral-500"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="mt-4 text-[15px] font-semibold text-neutral-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[14px] leading-6 text-neutral-600">
                  {feature.description}
                </p>
                {feature.visual === "runway" ? <ScenarioRunwayBars /> : null}
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
