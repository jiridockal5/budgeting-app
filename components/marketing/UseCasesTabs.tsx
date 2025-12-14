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
      items: ["24-mo forecast", "3 scenarios", "Key metrics deck"],
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
      items: ["12 roles planned", "€420K annual cost", "18-mo runway"],
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
      items: ["Base: 14mo runway", "Conservative: 18mo", "Aggressive: 10mo"],
    },
  },
  {
    id: "board",
    label: "Board update",
    icon: FileText,
    headline: "Monthly board reporting",
    bullets: [
      "Export key metrics and narrative for board decks",
      "Track actuals vs forecast over time",
    ],
    ui: {
      title: "Dec Board Deck",
      items: ["ARR: €312K (+24%)", "Burn: €42K/mo", "Runway: 18.2mo"],
    },
  },
];

export function UseCasesTabs() {
  const [activeTab, setActiveTab] = useState("fundraising");
  const prefersReducedMotion = useReducedMotion();
  const activeCase = useCases.find((uc) => uc.id === activeTab)!;

  return (
    <section className="relative py-16 md:py-20 lg:py-24">
      {/* Background */}
      <div className="absolute inset-0 bg-neutral-50/50" />

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

        {/* Tabs */}
        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {useCases.map((uc) => (
              <button
                key={uc.id}
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

        {/* Panel */}
        <Reveal delay={0.2}>
          <div className="mt-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="grid gap-8 md:grid-cols-2"
              >
                {/* Content */}
                <div className="flex flex-col justify-center">
                  <h3 className="text-xl font-semibold text-neutral-900">
                    {activeCase.headline}
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {activeCase.bullets.map((bullet, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-[14px] leading-6 text-neutral-600"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mini UI placeholder */}
                <div className="rounded-xl border border-neutral-200 bg-white p-5">
                  <div className="mb-4 text-[13px] font-semibold text-neutral-900">
                    {activeCase.ui.title}
                  </div>
                  <div className="space-y-2">
                    {activeCase.ui.items.map((item, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-neutral-50 px-3 py-2 text-[13px] text-neutral-600"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

