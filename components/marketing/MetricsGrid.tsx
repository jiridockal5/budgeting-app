"use client";

import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { Info } from "lucide-react";

const categories = [
  { id: "income", label: "Income" },
  { id: "spending", label: "Spending" },
  { id: "savings", label: "Savings" },
  { id: "goals", label: "Goals" },
  { id: "cash-flow", label: "Cash flow" },
];

const metrics = [
  {
    name: "Income",
    description: "Money coming in each month",
    category: "income",
  },
  {
    name: "Bills",
    description: "Fixed recurring obligations",
    category: "spending",
  },
  {
    name: "Flexible spend",
    description: "Variable day-to-day costs",
    category: "spending",
  },
  {
    name: "Savings rate",
    description: "Share of income saved",
    category: "savings",
  },
  {
    name: "Cash cushion",
    description: "Months of expenses covered",
    category: "cash-flow",
  },
  {
    name: "Goal progress",
    description: "Savings target progress",
    category: "goals",
  },
  {
    name: "Spending mix",
    description: "Where your money goes",
    category: "spending",
  },
  {
    name: "Net cash flow",
    description: "Income minus expenses",
    category: "cash-flow",
  },
  {
    name: "Planned balance",
    description: "Expected ending cash",
    category: "cash-flow",
  },
  {
    name: "Over-budget risk",
    description: "Early warning on shortfalls",
    category: "goals",
  },
];

export function MetricsGrid() {
  return (
    <section id="metrics" className="relative py-10 md:py-12 lg:py-14">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="text-center">
            <p className="text-[12px] font-medium uppercase tracking-wider text-neutral-500">
              Budget metrics
            </p>
            <h2 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-neutral-900 md:text-[2rem]">
              All the numbers that keep your plan clear
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-neutral-600">
              Calculated automatically from your budget. Always up to date and ready to review.
            </p>
          </div>
        </Reveal>

        {/* Category chips */}
        <Reveal delay={0.1}>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <span
                key={cat.id}
                className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[12px] font-medium text-neutral-600"
              >
                {cat.label}
              </span>
            ))}
          </div>
        </Reveal>

        {/* Metrics grid */}
        <RevealGroup className="mt-8 grid grid-cols-2 gap-3 md:mt-10 md:grid-cols-5 md:gap-4">
          {metrics.map((metric) => (
            <RevealItem key={metric.name}>
              <div className="group relative rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[14px] font-semibold text-neutral-900">
                    {metric.name}
                  </h3>
                  <button
                    className="shrink-0 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={`More info about ${metric.name}`}
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1 text-[12px] leading-5 text-neutral-500">
                  {metric.description}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

