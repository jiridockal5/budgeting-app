"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import type { ForecastMonth } from "@/lib/revenueForecast";

interface WaterfallChartProps {
  months: ForecastMonth[];
}

export function WaterfallChart({ months }: WaterfallChartProps) {
  if (months.length === 0) return null;

  const last = months[months.length - 1];
  const first = months[0];

  const data = [
    { name: "Starting MRR", value: first.totalMrr, fill: "#a3a3a3" },
    {
      name: "New MRR",
      value: months.reduce((sum, m) => sum + m.newMrr, 0),
      fill: "#10b981",
    },
    {
      name: "Expansion",
      value: months.reduce((sum, m) => sum + m.expansionMrr, 0),
      fill: "#3b82f6",
    },
    {
      name: "Churned",
      value: -months.reduce((sum, m) => sum + m.churnedMrr, 0),
      fill: "#ef4444",
    },
    { name: "Ending MRR", value: last.totalMrr, fill: "#7ecfc7" },
  ];

  function defaultFormat(value: number): string {
    if (Math.abs(value) >= 1_000_000)
      return `€${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
    return `€${value.toFixed(0)}`;
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-neutral-900">MRR Waterfall</h3>
      <p className="text-sm text-neutral-500 mt-1">
        Breakdown of MRR changes over the forecast period.
      </p>
      <div className="mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#a3a3a3" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e5e5" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#a3a3a3" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={defaultFormat}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e5e5",
                borderRadius: "8px",
                fontSize: "13px",
              }}
              formatter={(value: number | undefined) => [defaultFormat(value ?? 0), "MRR"]}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
