"use client";

import { useMemo } from "react";
import { TrendingUp, Users, DollarSign, BarChart3, Percent, UserMinus } from "lucide-react";
import type { PlgAdvancedConfig } from "@/lib/revenueForecast";
import { resolveAllPlgMetrics, computePlgSummary } from "@/lib/plgForecast";

interface PlgLiveSummaryProps {
  config: PlgAdvancedConfig;
  numMonths: number;
}

function SummaryMetric({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    emerald: "bg-emerald-50",
    blue: "bg-blue-50",
    indigo: "bg-indigo-50",
    amber: "bg-amber-50",
    rose: "bg-rose-50",
    violet: "bg-violet-50",
  };
  const textMap: Record<string, string> = {
    emerald: "text-emerald-600",
    blue: "text-blue-600",
    indigo: "text-indigo-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
    violet: "text-violet-600",
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${bgMap[color] ?? "bg-slate-50"}`}
      >
        <div className={textMap[color] ?? "text-slate-600"}>{icon}</div>
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-900 tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

export function PlgLiveSummary({ config, numMonths }: PlgLiveSummaryProps) {
  const summary = useMemo(() => {
    const resolved = resolveAllPlgMetrics(config, numMonths);
    return computePlgSummary(resolved, numMonths);
  }, [config, numMonths]);

  const formatNum = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString("en-US");

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-emerald-600" />
        <h3 className="text-sm font-semibold text-slate-900">
          Live forecast summary
        </h3>
        <span className="text-xs text-slate-400">
          (month {numMonths} projection)
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryMetric
          icon={<Users className="h-3.5 w-3.5" />}
          label="Total new customers"
          value={formatNum(summary.totalNewCustomers)}
          color="emerald"
        />
        <SummaryMetric
          icon={<Users className="h-3.5 w-3.5" />}
          label={`Customers (M${numMonths})`}
          value={formatNum(summary.month24Customers)}
          color="blue"
        />
        <SummaryMetric
          icon={<DollarSign className="h-3.5 w-3.5" />}
          label={`PLG MRR (M${numMonths})`}
          value={`\u20ac${formatNum(summary.month24Mrr)}`}
          color="indigo"
        />
        <SummaryMetric
          icon={<BarChart3 className="h-3.5 w-3.5" />}
          label={`PLG ARR (M${numMonths})`}
          value={`\u20ac${formatNum(summary.month24Arr)}`}
          color="violet"
        />
        <SummaryMetric
          icon={<Percent className="h-3.5 w-3.5" />}
          label="Avg. conversion"
          value={`${summary.avgFullFunnelConversion.toFixed(2)}%`}
          color="amber"
        />
        <SummaryMetric
          icon={<UserMinus className="h-3.5 w-3.5" />}
          label="Avg. monthly churn"
          value={`${summary.avgChurn.toFixed(1)}%`}
          color="rose"
        />
      </div>
    </div>
  );
}
