"use client";

import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
} from "recharts";
import type { ForecastMonth } from "@/lib/revenueForecast";
import { formatCompact } from "./formatters";

interface PnlChartProps {
  months: ForecastMonth[];
}

export function PnlChart({ months }: PnlChartProps) {
  if (months.length === 0) return null;

  const step = months.length > 24 ? Math.ceil(months.length / 24) : 1;
  const data = months
    .filter((_, i) => i % step === 0 || i === months.length - 1)
    .map((m) => ({
      date: m.date,
      revenue: Math.round(m.totalMrr),
      cos: Math.round(m.cosExpense),
      gtm: Math.round(m.gtmExpense),
      rnd: Math.round(m.rndExpense),
      cs: Math.round(m.csExpense),
      ops: Math.round(m.opsExpense),
      ebit: Math.round(m.ebit),
    }));

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-neutral-900">Monthly P&L</h3>
      <p className="text-sm text-neutral-500 mt-1">
        Recognized revenue, cost of sales, operating expenses, and EBIT over time.
      </p>
      <div className="mt-5 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#a3a3a3" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e5e5" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#a3a3a3" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCompact}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e5e5",
                borderRadius: "8px",
                fontSize: "13px",
              }}
              formatter={(value: number | undefined, name: string | undefined) => [
                formatCompact(value ?? 0),
                name ?? "",
              ]}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
            <Bar dataKey="cos" name="Cost of Sales" stackId="opex" fill="#fca5a5" />
            <Bar dataKey="gtm" name="GTM" stackId="opex" fill="#fcd34d" />
            <Bar dataKey="rnd" name="R&D" stackId="opex" fill="#a8ddd8" />
            <Bar dataKey="cs" name="CS" stackId="opex" fill="#93c5fd" />
            <Bar dataKey="ops" name="Ops" stackId="opex" fill="#a3a3a3" radius={[4, 4, 0, 0]} />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="ebit"
              name="EBIT"
              stroke="#7ecfc7"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
