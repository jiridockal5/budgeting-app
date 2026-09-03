"use client";

import { useState } from "react";
import { Reveal } from "./Reveal";

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
    value: "€1.2K",
    description: "Cost to acquire a customer",
    category: "unit",
  },
  {
    name: "CAC Payback",
    value: "9 mo",
    description: "Months to recover CAC",
    category: "efficiency",
  },
  {
    name: "LTV/CAC",
    value: "4.2×",
    description: "Unit economics ratio",
    category: "unit",
  },
  {
    name: "NRR",
    value: "118%",
    description: "Net revenue retention",
    category: "retention",
  },
  {
    name: "GRR",
    value: "94%",
    description: "Gross revenue retention",
    category: "retention",
  },
  {
    name: "ARR Growth",
    value: "86%",
    description: "Year-over-year growth",
    category: "growth",
  },
  {
    name: "Net New ARR Mix",
    value: "62% new",
    description: "Expansion vs new vs churn",
    category: "growth",
  },
  {
    name: "Gross Margin",
    value: "78%",
    description: "Margin after COGS",
    category: "efficiency",
  },
  {
    name: "Burn Multiple",
    value: "1.4×",
    description: "Burn / Net New ARR",
    category: "efficiency",
  },
  {
    name: "Rule of 40",
    value: "62",
    description: "Growth + margin score",
    category: "efficiency",
  },
  {
    name: "Runway",
    value: "18 mo",
    description: "Months of cash remaining",
    category: "runway",
  },
  {
    name: "Net burn",
    value: "€42K",
    description: "Monthly cash consumed",
    category: "runway",
  },
];

export function MetricsGrid() {
  const [activeCategory, setActiveCategory] = useState("all");
  const filteredMetrics =
    activeCategory === "all"
      ? metrics
      : metrics.filter((metric) => metric.category === activeCategory);

  return (
    <section id="metrics" className="relative py-8 md:py-10 lg:py-12">
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

        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {[{ id: "all", label: "All" }, ...categories].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  activeCategory === cat.id
                    ? "bg-neutral-900 text-white"
                    : "border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-10 flex flex-wrap justify-center gap-3 md:gap-4">
          {filteredMetrics.map((metric) => (
            <div
              key={metric.name}
              className="group relative w-[calc((100%-0.75rem)/2)] shrink-0 rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 md:w-[calc((100%-3rem)/4)] lg:w-[calc((100%-5rem)/6)]"
            >
              <h3 className="text-[12px] font-semibold uppercase tracking-wide text-neutral-500">
                {metric.name}
              </h3>
              <p className="mt-2 text-[18px] font-semibold tabular-nums leading-none text-neutral-900">
                {metric.value}
              </p>
              <p className="mt-2 text-[12px] leading-5 text-neutral-500">
                {metric.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
