"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Reveal } from "./Reveal";
import { PiggyBank, CalendarDays, Layers, FileText } from "lucide-react";

const useCases = [
  {
    id: "monthly-budget",
    label: "Monthly budget",
    icon: CalendarDays,
    headline: "Stay ahead of every month",
    bullets: [
      "See expected income, bills, and spending before the month starts",
      "Spot gaps early and adjust categories before they become surprises",
    ],
    ui: {
      title: "June Budget",
      items: ["Income: €4,200", "Bills: €1,850", "Planned savings: €650"],
    },
  },
  {
    id: "savings",
    label: "Savings goals",
    icon: PiggyBank,
    headline: "Plan for the goals that matter",
    bullets: [
      "Map savings targets across vacations, emergency funds, or big purchases",
      "See how each goal changes your month-by-month cash balance",
    ],
    ui: {
      title: "Savings Plan",
      items: ["Emergency fund: 72%", "Vacation: €1,200 left", "New laptop: on track"],
    },
  },
  {
    id: "scenarios",
    label: "Scenario planning",
    icon: Layers,
    headline: "Compare multiple paths",
    bullets: [
      "Model conservative, normal, and stretch spending plans",
      "Instantly see how each scenario affects your cash flow",
    ],
    ui: {
      title: "Scenarios",
      items: ["Base: €900 left", "Conservative: €1,250", "Stretch: €420"],
    },
  },
  {
    id: "review",
    label: "Budget review",
    icon: FileText,
    headline: "Review and share your plan",
    bullets: [
      "Export a clean snapshot for household check-ins or personal reviews",
      "Use PDF and CSV exports to keep a record of each budget cycle",
    ],
    ui: {
      title: "Monthly Review",
      items: ["Saved: €650", "Groceries: €80 under", "Cash cushion: 3.4mo"],
    },
  },
];

export function UseCasesTabs() {
  const [activeTab, setActiveTab] = useState("monthly-budget");
  const prefersReducedMotion = useReducedMotion();
  const activeCase = useCases.find((uc) => uc.id === activeTab)!;

  return (
    <section className="relative py-10 md:py-12 lg:py-14">
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
          <div className="mt-8 flex flex-wrap justify-center gap-2">
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
          <div className="mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="grid gap-6 md:grid-cols-2"
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

