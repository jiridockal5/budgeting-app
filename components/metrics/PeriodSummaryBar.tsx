"use client";

import type { ForecastSummary } from "@/lib/revenueForecast";
import { formatCompact, formatPct } from "./formatters";

/** Period-level KPIs that are not meaningful as a single monthly column */
export function PeriodSummaryBar({ summary }: { summary: ForecastSummary }) {
  const items = [
    { label: "NRR", value: formatPct(summary.annualNrr) },
    { label: "GRR", value: formatPct(summary.annualGrr) },
    { label: "Net New ARR", value: formatCompact(summary.netNewArr) },
    { label: "CAC", value: formatCompact(summary.cac) },
    { label: "LTV / CAC", value: `${summary.ltvCacRatio.toFixed(1)}x` },
    {
      label: "Quick Ratio",
      value:
        summary.quickRatio >= 999 ? "∞" : `${summary.quickRatio.toFixed(1)}x`,
    },
    { label: "Burn Multiple", value: `${summary.burnMultiple.toFixed(1)}x` },
    { label: "Rule of 40", value: formatPct(summary.ruleOf40) },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">
        Period summary
      </p>
      <p className="text-xs text-slate-500 mt-0.5 mb-4">
        Aggregated across the selected period — see monthly tables below for
        month-by-month values.
      </p>
      <dl className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs text-slate-500">{item.label}</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
