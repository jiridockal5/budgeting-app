"use client";

import { Reveal } from "./Reveal";

export function ScreenshotFrame() {
  return (
    <section className="relative pb-16 md:pb-20 lg:pb-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="relative mx-auto max-w-5xl">
            {/* Frame wrapper */}
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg shadow-neutral-900/5">
              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                </div>
                <div className="ml-4 flex h-6 flex-1 items-center justify-center rounded-md bg-neutral-100 px-3">
                  <span className="text-[11px] text-neutral-400">
                    app.runwayforecast.com/plan
                  </span>
                </div>
              </div>

              {/* App UI Placeholder */}
              <div className="bg-neutral-50 p-6 md:p-8">
                {/* Top metrics row */}
                <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <MetricCard label="Monthly Burn" value="€42.5K" trend="-8%" />
                  <MetricCard label="Runway" value="18.2 mo" trend="+2.1" />
                  <MetricCard label="ARR" value="€312K" trend="+24%" />
                  <MetricCard label="Cash Balance" value="€774K" />
                </div>

                {/* Chart placeholder */}
                <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-[13px] font-medium text-neutral-900">
                      Cash Flow Forecast
                    </span>
                    <div className="flex gap-2">
                      <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                        <span className="h-2 w-2 rounded-full bg-neutral-400" />
                        Base
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                        <span className="h-2 w-2 rounded-full bg-neutral-300" />
                        Conservative
                      </span>
                    </div>
                  </div>
                  <div className="flex h-32 items-end gap-1 md:h-40">
                    {/* Chart bars */}
                    {[65, 58, 52, 48, 55, 62, 70, 78, 85, 90, 95, 100].map(
                      (h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-neutral-200 transition-all"
                          style={{ height: `${h}%` }}
                        />
                      )
                    )}
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-neutral-400">
                    <span>Jan</span>
                    <span>Jun</span>
                    <span>Dec</span>
                  </div>
                </div>

                {/* Table placeholder */}
                <div className="rounded-lg border border-neutral-200 bg-white">
                  <div className="border-b border-neutral-100 px-4 py-3">
                    <span className="text-[13px] font-medium text-neutral-900">
                      Budget Overview
                    </span>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    <TableRow label="Revenue" values={["€26K", "€29K", "€32K"]} />
                    <TableRow label="Payroll" values={["€35K", "€38K", "€42K"]} />
                    <TableRow label="Services" values={["€8K", "€8K", "€9K"]} />
                    <TableRow
                      label="Net Burn"
                      values={["€-17K", "€-17K", "€-19K"]}
                      highlight
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Subtle glow effect */}
            <div className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-b from-neutral-200/30 to-transparent blur-2xl" />
          </div>
        </Reveal>

        {/* Caption */}
        <Reveal delay={0.1}>
          <p className="mt-6 text-center text-[13px] text-neutral-500">
            A clear view of your runway, burn, and key metrics — updated
            instantly as you plan.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3">
      <p className="text-[11px] text-neutral-500">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-lg font-semibold text-neutral-900">{value}</span>
        {trend && (
          <span
            className={`text-[11px] font-medium ${
              trend.startsWith("-") ? "text-red-500" : "text-emerald-600"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function TableRow({
  label,
  values,
  highlight = false,
}: {
  label: string;
  values: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-4 gap-4 px-4 py-2.5 text-[12px] ${
        highlight ? "bg-neutral-50 font-medium" : ""
      }`}
    >
      <span className="text-neutral-600">{label}</span>
      {values.map((v, i) => (
        <span
          key={i}
          className={`text-right tabular-nums ${
            highlight ? "text-neutral-900" : "text-neutral-500"
          }`}
        >
          {v}
        </span>
      ))}
    </div>
  );
}

