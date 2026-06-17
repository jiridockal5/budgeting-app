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
import { EXPENSE_CATEGORY_SHORT_LABELS } from "@/lib/expenses";
import { formatCompact } from "./formatters";

interface CategoryExpenseChartProps {
  months: ForecastMonth[];
}

const CATEGORY_COLORS = {
  cos: "#ef4444",
  gtm: "#f59e0b",
  rnd: "#5bb5aa",
  cs: "#3b82f6",
  ops: "#737373",
};

export function CategoryExpenseChart({ months }: CategoryExpenseChartProps) {
  if (months.length === 0) return null;

  const step = months.length > 24 ? Math.ceil(months.length / 24) : 1;
  const data = months
    .filter((_, i) => i % step === 0 || i === months.length - 1)
    .map((m) => ({
      date: m.date,
      cos: Math.round(m.cosExpense),
      gtm: Math.round(m.gtmExpense),
      rnd: Math.round(m.rndExpense),
      cs: Math.round(m.csExpense),
      ops: Math.round(m.opsExpense),
    }));

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-neutral-900">
        Expense by Category
      </h3>
      <p className="text-sm text-neutral-500 mt-1">
        Functional breakdown: COS, GTM, R&D, CS, and Ops.
      </p>
      <div className="mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
                EXPENSE_CATEGORY_SHORT_LABELS[
                  name as keyof typeof EXPENSE_CATEGORY_SHORT_LABELS
                ] ?? name ?? "",
              ]}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
            {(["cos", "gtm", "rnd", "cs", "ops"] as const).map((key, idx, arr) => (
              <Bar
                key={key}
                dataKey={key}
                name={EXPENSE_CATEGORY_SHORT_LABELS[key]}
                stackId="expenses"
                fill={CATEGORY_COLORS[key]}
                radius={idx === arr.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
