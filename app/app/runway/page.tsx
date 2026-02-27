"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Banknote, AlertTriangle, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton, FormSectionSkeleton } from "@/components/ui/Skeleton";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { formatCurrency } from "@/lib/assumptions";
import type { ForecastResult, ForecastMonth } from "@/lib/revenueForecast";

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000)
    return `€${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `€${Math.round(value / 1_000)}K`;
  return formatCurrency(Math.round(value));
}

export default function RunwayPage() {
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const planRes = await fetch("/api/plans/current");
        const planData = await planRes.json();
        if (!planData.success) throw new Error(planData.error);

        const res = await fetch(`/api/forecast?planId=${planData.data.id}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        setForecast(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <FormSectionSkeleton />
            <FormSectionSkeleton />
            <FormSectionSkeleton />
          </div>
        </div>
      </main>
    );
  }

  const summary = forecast?.summary;
  const months = forecast?.months ?? [];
  const cashOnHand = summary?.cashOnHand ?? 0;
  const runwayMonths = summary?.runwayMonths ?? 0;
  const monthlyBurn = summary?.monthlyBurn ?? 0;
  const isInfinite = runwayMonths >= 999;

  const zeroMonth = months.find((m) => m.cashRemaining <= 0);
  const runoutDate = zeroMonth?.date;

  const runwayColor =
    isInfinite || runwayMonths > 18
      ? "text-emerald-600"
      : runwayMonths > 12
        ? "text-amber-600"
        : "text-rose-600";

  const runwayBg =
    isInfinite || runwayMonths > 18
      ? "border-emerald-200 bg-emerald-50"
      : runwayMonths > 12
        ? "border-amber-200 bg-amber-50"
        : "border-red-200 bg-red-50";

  const cashChartData = months
    .filter(
      (_, i) =>
        i %
          (months.length > 24
            ? Math.ceil(months.length / 24)
            : 1) ===
          0 || i === months.length - 1
    )
    .map((m) => ({
      date: m.date,
      cash: Math.round(Math.max(0, m.cashRemaining)),
      expenses: Math.round(m.totalExpense),
      revenue: Math.round(m.totalMrr),
    }));

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="space-y-8">
          <PageHeader
            title="Runway"
            subtitle="How long your cash will last at the current burn rate."
            actions={
              <Link
                href="/app/assumptions"
                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                Edit cash & assumptions
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Big runway card */}
          <div
            className={`rounded-2xl border p-8 shadow-sm ${runwayBg}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                  Estimated Runway
                </p>
                <p className={`mt-2 text-5xl font-bold tabular-nums ${runwayColor}`}>
                  {isInfinite ? "∞" : `${Math.round(runwayMonths)} months`}
                </p>
                {runoutDate && (
                  <p className="mt-2 text-sm text-slate-600">
                    Cash runs out around{" "}
                    <span className="font-semibold text-slate-900">
                      {runoutDate}
                    </span>
                  </p>
                )}
                {isInfinite && (
                  <p className="mt-2 text-sm text-emerald-700">
                    Revenue covers expenses within the forecast period.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <RunwayStat
                  icon={<Banknote className="h-4 w-4 text-emerald-600" />}
                  label="Cash on hand"
                  value={formatCompact(cashOnHand)}
                />
                <RunwayStat
                  icon={<TrendingDown className="h-4 w-4 text-rose-600" />}
                  label="Monthly burn"
                  value={formatCompact(Math.abs(monthlyBurn))}
                />
              </div>
            </div>

            {!isInfinite && runwayMonths <= 12 && (
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-100 px-4 py-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
                <p className="text-sm text-red-800">
                  <span className="font-semibold">Low runway warning.</span>{" "}
                  Consider reducing burn or securing additional funding.
                </p>
              </div>
            )}
          </div>

          {/* Runway progress bar */}
          {!isInfinite && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Cash Countdown
              </h2>
              <div className="relative">
                <div className="h-4 w-full rounded-full bg-slate-200">
                  <div
                    className={`h-4 rounded-full transition-all duration-700 ${
                      runwayMonths > 18
                        ? "bg-emerald-500"
                        : runwayMonths > 12
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(100, (runwayMonths / Math.max(months.length, 24)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>Today</span>
                  <span>
                    {runoutDate
                      ? `Out of cash: ${runoutDate}`
                      : `${Math.round(runwayMonths)} months`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Cash over time chart */}
          <ChartCard
            title="Cash Balance Over Time"
            description="Projected cash remaining based on your current forecast."
            data={cashChartData}
            series={[
              { dataKey: "cash", name: "Cash Remaining", color: "#6366f1" },
              { dataKey: "revenue", name: "Monthly Revenue", color: "#10b981" },
              { dataKey: "expenses", name: "Monthly Expenses", color: "#ef4444" },
            ]}
          />

          {cashOnHand === 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
              <Banknote className="mx-auto h-10 w-10 text-amber-400" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                Set your starting cash balance
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Go to{" "}
                <Link
                  href="/app/assumptions"
                  className="text-indigo-600 hover:underline font-medium"
                >
                  Assumptions
                </Link>{" "}
                and enter your current cash on hand to see accurate runway
                projections.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function RunwayStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className="text-lg font-bold text-slate-900 tabular-nums">{value}</p>
    </div>
  );
}
