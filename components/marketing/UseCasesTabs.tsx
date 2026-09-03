"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Reveal } from "./Reveal";
import { Rocket, Users, Layers, FileText } from "lucide-react";

const useCases = [
  {
    id: "fundraising",
    label: "Fundraising",
    icon: Rocket,
    headline: "Investor-ready forecasts",
    bullets: [
      "Show exactly how much runway you have and when you'll need to raise",
      "Present metrics like Burn Multiple, LTV/CAC, and Rule of 40 with confidence",
    ],
    ui: {
      title: "Series A Model",
      subtitle: "24-month forecast",
      kpis: [
        { label: "ARR", value: "€312K", hint: "+24%" },
        { label: "Runway", value: "18.2 mo", hint: "at burn" },
        { label: "Rule of 40", value: "62", hint: "growth + GM" },
      ],
      rows: [
        { label: "Burn Multiple", value: "1.4×" },
        { label: "LTV / CAC", value: "4.2×" },
        { label: "NRR", value: "118%" },
      ],
    },
  },
  {
    id: "hiring",
    label: "Hiring plan",
    icon: Users,
    headline: "Plan your team growth",
    bullets: [
      "Map out when to hire each role based on cash and milestones",
      "See how each hire impacts burn rate and runway",
    ],
    ui: {
      title: "Headcount Plan",
      subtitle: "12 roles · €420K / yr",
      kpis: [
        { label: "Roles", value: "12", hint: "planned" },
        { label: "Annual cost", value: "€420K", hint: "fully loaded" },
        { label: "Runway", value: "18 mo", hint: "after hires" },
      ],
      rows: [
        { label: "Founding engineer · Apr", value: "€8.5K/mo" },
        { label: "Head of Sales · Jul", value: "€9.0K/mo" },
        { label: "Customer success · Oct", value: "€6.2K/mo" },
      ],
    },
  },
  {
    id: "scenarios",
    label: "Scenario planning",
    icon: Layers,
    headline: "Compare multiple paths",
    bullets: [
      "Model aggressive vs conservative growth assumptions",
      "Instantly see how each scenario affects runway",
    ],
    ui: {
      title: "Scenarios",
      subtitle: "Same starting cash",
      kpis: [
        { label: "Conservative", value: "18 mo", hint: "slower hire" },
        { label: "Base", value: "14 mo", hint: "current plan" },
        { label: "Aggressive", value: "10 mo", hint: "scale GTM" },
      ],
      rows: [
        { label: "Cash at month 12", value: "€186K" },
        { label: "End ARR (base)", value: "€312K" },
        { label: "Raise needed by", value: "Jun 2027" },
      ],
    },
  },
  {
    id: "board",
    label: "Board update",
    icon: FileText,
    headline: "Monthly board reporting",
    bullets: [
      "Export key metrics and narrative for board decks",
      "Export PDF and CSV metrics for board-ready reporting",
    ],
    ui: {
      title: "Dec Board Deck",
      subtitle: "Ready to export",
      kpis: [
        { label: "ARR", value: "€312K", hint: "+24%" },
        { label: "Burn", value: "€42K", hint: "per month" },
        { label: "Runway", value: "18.2 mo", hint: "to raise" },
      ],
      rows: [
        { label: "Gross margin", value: "78%" },
        { label: "Net new ARR mix", value: "62% new" },
        { label: "Export", value: "PDF · CSV" },
      ],
    },
  },
];

function UseCasePreview({
  ui,
}: {
  ui: (typeof useCases)[number]["ui"];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_12px_40px_-20px_rgba(23,23,23,0.14)]">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-turquoise-400" />
          <span className="text-[13px] font-semibold text-neutral-900">
            {ui.title}
          </span>
        </div>
        <span className="text-[11px] text-neutral-500">{ui.subtitle}</span>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-3 gap-2">
          {ui.kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl border border-neutral-200 bg-neutral-50/80 px-2.5 py-2.5 sm:px-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                {kpi.label}
              </p>
              <p className="mt-1 text-[15px] font-semibold tabular-nums leading-none text-neutral-900 sm:text-[16px]">
                {kpi.value}
              </p>
              <p className="mt-1 text-[10px] text-neutral-500">{kpi.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 divide-y divide-neutral-100 rounded-xl border border-neutral-100">
          {ui.rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 px-3 py-2.5"
            >
              <span className="text-[12px] text-neutral-600">{row.label}</span>
              <span className="shrink-0 text-[12px] font-medium tabular-nums text-neutral-900">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function UseCasesTabs() {
  const [activeTab, setActiveTab] = useState("fundraising");
  const prefersReducedMotion = useReducedMotion();
  const activeCase = useCases.find((uc) => uc.id === activeTab)!;

  return (
    <section className="relative py-8 md:py-10 lg:py-12">
      <div className="pointer-events-none absolute inset-0 bg-neutral-50/50" />

      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="text-center">
            <p className="text-[12px] font-medium uppercase tracking-wider text-neutral-500">
              Use cases
            </p>
            <h2 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-neutral-900 md:text-[2rem]">
              Built for the moments that matter
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {useCases.map((uc) => (
              <button
                key={uc.id}
                type="button"
                onClick={() => setActiveTab(uc.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                  activeTab === uc.id
                    ? "bg-neutral-900 text-white"
                    : "border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                }`}
              >
                <uc.icon className="h-4 w-4" />
                {uc.label}
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="grid items-center gap-8 md:grid-cols-2 md:gap-10"
              >
                <div className="flex flex-col justify-center">
                  <h3 className="text-xl font-semibold text-neutral-900">
                    {activeCase.headline}
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {activeCase.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-3 text-[14px] leading-6 text-neutral-600"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-turquoise-400" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>

                <UseCasePreview ui={activeCase.ui} />
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
