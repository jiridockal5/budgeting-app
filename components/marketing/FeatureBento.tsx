"use client";

import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { LottiePlaceholder } from "./LottiePlayer";
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
      "Compare Base / Conservative / Aggressive in one view. See how each path affects your cash flow.",
    chips: ["Cash flow", "Planning"],
    icon: Layers,
    span: "md:col-span-2",
  },
  {
    id: "setup",
    title: "Fast setup",
    description:
      "Start with a few numbers; expand as you learn. No templates, no complexity upfront.",
    chips: ["Onboarding"],
    icon: Zap,
    span: "md:col-span-1",
  },
  {
    id: "revenue",
    title: "Income planning",
    description:
      "Track salary, side income, recurring deposits, or variable earnings in one simple forecast.",
    chips: ["Income", "Forecast"],
    icon: TrendingUp,
    span: "md:col-span-1",
  },
  {
    id: "hiring",
    title: "Bills & expenses",
    description:
      "Plan fixed bills, flexible spending, and one-time costs with everything reflected in your balance.",
    chips: ["Bills", "Costs"],
    icon: Users,
    span: "md:col-span-1",
  },
  {
    id: "metrics",
    title: "Budget health metrics",
    description:
      "Savings rate, spending mix, cash cushion, and balance trends stay ready whenever you review the plan.",
    chips: ["Metrics", "Goals"],
    icon: BarChart3,
    span: "md:col-span-1",
  },
  {
    id: "realtime",
    title: "Always up to date",
    description:
      "Change one assumption and the full model updates instantly. No manual recalculation.",
    chips: ["Real-time"],
    icon: RefreshCw,
    span: "md:col-span-2",
  },
];

export function FeatureBento() {
  return (
    <section className="relative py-10 md:py-12 lg:py-14">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-neutral-50/50" />

      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="text-center">
            <p className="text-[12px] font-medium uppercase tracking-wider text-neutral-500">
              Features
            </p>
            <h2 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-neutral-900 md:text-[2rem]">
              Everything you need to plan your budget
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-neutral-600">
              Simple inputs, powerful outputs. Focus on decisions, not spreadsheet formulas.
            </p>
          </div>
        </Reveal>

        <RevealGroup className="mt-8 grid gap-4 md:mt-10 md:grid-cols-3 md:gap-4">
          {features.map((feature) => (
            <RevealItem key={feature.id} className={feature.span}>
              <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-300">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <TurquoiseIconBadge>
                    <feature.icon className="h-5 w-5" />
                  </TurquoiseIconBadge>
                  <div className="flex flex-wrap gap-1.5">
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

                {/* Content */}
                <h3 className="mt-4 text-[15px] font-semibold text-neutral-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[14px] leading-6 text-neutral-600">
                  {feature.description}
                </p>

                {/* Lottie placeholder area */}
                <div className="mt-4 flex-1">
                  <LottiePlaceholder
                    className="h-24 w-full md:h-28"
                    icon={
                      <feature.icon className="h-8 w-8 text-neutral-300" />
                    }
                  />
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

