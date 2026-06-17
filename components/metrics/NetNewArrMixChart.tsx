"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { NetNewArrMix } from "@/lib/revenueForecast";
import { formatPct } from "./formatters";

interface NetNewArrMixChartProps {
  mix: NetNewArrMix;
  totalNewMrr: number;
  totalExpansionMrr: number;
  totalChurnedMrr: number;
}

const COLORS = {
  new: "#10b981",
  expansion: "#3b82f6",
  churn: "#ef4444",
};

const COLOR_BY_NAME: Record<string, string> = {
  "New MRR": COLORS.new,
  "Expansion MRR": COLORS.expansion,
  "Churned MRR": COLORS.churn,
};

export function NetNewArrMixChart({
  mix,
  totalNewMrr,
  totalExpansionMrr,
  totalChurnedMrr,
}: NetNewArrMixChartProps) {
  const data = [
    { name: "New MRR", value: totalNewMrr, pct: mix.newPct },
    { name: "Expansion MRR", value: totalExpansionMrr, pct: mix.expansionPct },
    { name: "Churned MRR", value: totalChurnedMrr, pct: mix.churnPct },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return null;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-neutral-900">Net New ARR Mix</h3>
      <p className="text-sm text-neutral-500 mt-1">
        Composition of MRR movement over the forecast period.
      </p>
      <div className="mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={COLOR_BY_NAME[entry.name] ?? "#a3a3a3"}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e5e5",
                borderRadius: "8px",
                fontSize: "13px",
              }}
              formatter={(value, _name, item) => {
                const pct = (item?.payload as { pct?: number; name?: string })?.pct ?? 0;
                const name = (item?.payload as { name?: string })?.name ?? "";
                return [`${formatPct(pct)} of movement`, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
