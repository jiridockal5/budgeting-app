"use client";

import Link from "next/link";
import { formatCompactCurrency } from "@/lib/currency";
import type { StartingRunRate } from "@/lib/revenueForecast";

function formatRunway(months: number): string {
  if (months >= 999) return "∞";
  if (months < 1) return `${Math.round(months * 10) / 10} mo`;
  return `${Math.round(months)} mo`;
}

export function StartingRunRateStrip({
  snapshot,
}: {
  snapshot: StartingRunRate;
}) {
  const burning = snapshot.netBurn > 0;
  return (
    <section
      aria-labelledby="starting-run-rate-heading"
      className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="starting-run-rate-heading"
            className="text-sm font-semibold text-neutral-900"
          >
            As of {snapshot.date}
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Current run-rate before later hires and the raise. Charts below are
            the plan after start.
          </p>
        </div>
        <Link
          href="/app/assumptions"
          className="text-xs font-medium text-turquoise-600 hover:text-turquoise-700"
        >
          Edit start month &amp; cash
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Current MRR" value={formatCompactCurrency(snapshot.currentMrr)} />
        <Stat
          label="In-place costs"
          value={formatCompactCurrency(snapshot.currentCosts)}
          hint={`${formatCompactCurrency(snapshot.currentCos)} COS · ${formatCompactCurrency(snapshot.currentOpex)} opex`}
        />
        <Stat
          label="Net burn"
          value={formatCompactCurrency(snapshot.netBurn)}
          hint={burning ? "costs − MRR" : "profitable at this run-rate"}
        />
        <Stat
          label="Cash on hand"
          value={formatCompactCurrency(snapshot.cashOnHand)}
        />
        <Stat
          label="Runway at this burn"
          value={formatRunway(snapshot.runwayMonths)}
        />
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-neutral-900">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-neutral-400">{hint}</p> : null}
    </div>
  );
}
