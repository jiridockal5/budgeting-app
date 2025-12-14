"use client";

import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { Info } from "lucide-react";

const categories = [
  { id: "growth", label: "Growth" },
  { id: "retention", label: "Retention" },
  { id: "efficiency", label: "Efficiency" },
  { id: "unit", label: "Unit economics" },
  { id: "runway", label: "Runway" },
];

const metrics = [
  {
    name: "CAC",
    description: "Cost to acquire a customer",
    category: "unit",
  },
  {
    name: "CAC Payback",
    description: "Months to recover CAC",
    category: "efficiency",
  },
  {
    name: "LTV/CAC",
    description: "Unit economics ratio",
    category: "unit",
  },
  {
    name: "NRR",
    description: "Net revenue retention",
    category: "retention",
  },
  {
    name: "GRR",
    description: "Gross revenue retention",
    category: "retention",
  },
  {
    name: "ARR Growth",
    description: "Year-over-year growth",
    category: "growth",
  },
  {
    name: "Net New ARR Mix",
    description: "Expansion vs new vs churn",
    category: "growth",
  },
  {
    name: "Gross Margin",
    description: "Margin after COGS",
    category: "efficiency",
  },
  {
    name: "Burn Multiple",
    description: "Burn / Net New ARR",
    category: "efficiency",
  },
  {
    name: "Rule of 40",
    description: "Growth + margin score",
    category: "efficiency",
  },
];

export function MetricsGrid() {
  return (
    <section id="metrics" className="relative py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="text-center">
            <p className="text-[12px] font-medium uppercase tracking-wider text-neutral-500">
              Investor Metrics
            </p>
            <h2 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-neutral-900 md:text-[2rem]">
              All the metrics investors want to see
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-neutral-600">
              Calculated automatically from your forecast. Always up to date, always ready to share.
            </p>
          </div>
        </Reveal>

        {/* Category chips */}
        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
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
        <RevealGroup className="mt-10 grid grid-cols-2 gap-3 md:mt-12 md:grid-cols-5 md:gap-4">
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

