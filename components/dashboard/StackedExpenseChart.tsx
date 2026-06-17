"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ForecastMonth } from "@/lib/revenueForecast";

interface StackedExpenseChartProps {
  months: ForecastMonth[];
}

function defaultFormat(value: number): string {
  if (Math.abs(value) >= 1_000_000)
    return `€${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value.toFixed(0)}`;
}

export function StackedExpenseChart({ months }: StackedExpenseChartProps) {
  if (months.length === 0) return null;

  const step = months.length > 24 ? Math.ceil(months.length / 24) : 1;
  const data = months
    .filter((_, i) => i % step === 0 || i === months.length - 1)
    .map((m) => ({
      date: m.date,
      headcount: Math.round(m.headcountExpense),
      nonHeadcount: Math.round(m.nonHeadcountExpense),
    }));

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-neutral-900">
        Expense Breakdown
      </h3>
      <p className="text-sm text-neutral-500 mt-1">
        Headcount vs non-headcount expenses over time.
      </p>
      <div className="mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
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
              formatter={(value: number | undefined, name: string | undefined) => [
                defaultFormat(value ?? 0),
                name ?? "",
              ]}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
            <Bar
              dataKey="headcount"
              name="Headcount"
              stackId="expenses"
              fill="#5bb5aa"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="nonHeadcount"
              name="Non-headcount"
              stackId="expenses"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
