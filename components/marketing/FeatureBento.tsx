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

const features = [
  {
    id: "scenarios",
    title: "Scenario planning",
    description:
      "Compare Base / Conservative / Aggressive in one view. See how each path affects your runway.",
    chips: ["Runway", "Planning"],
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
    title: "Revenue modeling",
    description:
      "PLG, Sales-led, or partner motions. Keep it lightweight or go deep — your choice.",
    chips: ["Revenue", "Growth"],
    icon: TrendingUp,
    span: "md:col-span-1",
  },
  {
    id: "hiring",
    title: "Hiring & expenses",
    description:
      "Headcount plan, tools, services, and overhead. All in one place, all reflected in your burn.",
    chips: ["Headcount", "Costs"],
    icon: Users,
    span: "md:col-span-1",
  },
  {
    id: "metrics",
    title: "Investor metrics",
    description:
      "CAC Payback, LTV/CAC, NRR/GRR, Burn Multiple, Rule of 40, and more. Always ready for board decks.",
    chips: ["Metrics", "Fundraising"],
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
    <section className="relative py-16 md:py-20 lg:py-24">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-neutral-50/50" />

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

        <RevealGroup className="mt-12 grid gap-4 md:mt-16 md:grid-cols-3 md:gap-5">
          {features.map((feature) => (
            <RevealItem key={feature.id} className={feature.span}>
              <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-300">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
                    <feature.icon className="h-5 w-5" />
                  </div>
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
                <div className="mt-6 flex-1">
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

