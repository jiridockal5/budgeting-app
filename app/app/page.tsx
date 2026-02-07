"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { SaasMetricCard } from "@/components/dashboard/SaasMetricCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatCurrency } from "@/lib/assumptions";
import type { ForecastResult, ForecastMonth } from "@/lib/revenueForecast";

// ============================================================================
// Helpers
// ============================================================================

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000)
    return `€${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `€${Math.round(value / 1_000)}K`;
  return formatCurrency(Math.round(value));
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

function buildMetrics(summary: ForecastResult["summary"]) {
  return [
    {
      id: "arr",
      name: "ARR",
      value: formatCompact(summary.projectedArr),
      helper: "Projected annual recurring revenue at end of forecast.",
    },
    {
      id: "mrr",
      name: "MRR",
      value: formatCompact(summary.projectedMrr),
      helper: "Projected monthly recurring revenue at end of forecast.",
    },
    {
      id: "nrr",
      name: "NRR",
      value: formatPct(summary.annualNrr),
      helper: "Net revenue retention. Target > 100%, great > 120%.",
    },
    {
      id: "grr",
      name: "GRR",
      value: formatPct(summary.annualGrr),
      helper: "Gross revenue retention. Excludes expansion; target > 90%.",
    },
    {
      id: "cac",
      name: "CAC",
      value: formatCompact(summary.cac),
      helper: "Customer acquisition cost from your global assumptions.",
    },
    {
      id: "cac-payback",
      name: "CAC Payback",
      value: `${summary.cacPaybackMonths.toFixed(0)} mo`,
      helper: "Months to recover CAC. Aim for < 12 months.",
    },
    {
      id: "ltv-cac",
      name: "LTV / CAC",
      value: `${summary.ltvCacRatio.toFixed(1)}x`,
      helper: "Lifetime value ratio. Healthy range: 3x–5x.",
    },
    {
      id: "burn-multiple",
      name: "Burn Multiple",
      value: `${summary.burnMultiple.toFixed(1)}x`,
      helper: "Cash burn ÷ net new ARR. Lower is more efficient.",
    },
    {
      id: "rule-of-40",
      name: "Rule of 40",
      value: formatPct(summary.ruleOf40),
      helper: "Growth rate + profit margin. Target ≥ 40%.",
    },
    {
      id: "net-new-arr",
      name: "Net New ARR",
      value: formatCompact(summary.netNewArr),
      helper: "New + expansion − churn over the forecast period.",
    },
  ];
}

function buildArrChartData(months: ForecastMonth[]) {
  // Sample every nth point to avoid overcrowding the chart
  const step = months.length > 24 ? Math.ceil(months.length / 24) : 1;
  return months
    .filter((_, i) => i % step === 0 || i === months.length - 1)
    .map((m) => ({
      date: m.date,
      plgArr: Math.round(m.plgMrr * 12),
      salesArr: Math.round(m.salesMrr * 12),
      partnerArr: Math.round(m.partnerMrr * 12),
    }));
}

function buildBurnChartData(months: ForecastMonth[]) {
  const step = months.length > 24 ? Math.ceil(months.length / 24) : 1;
  return months
    .filter((_, i) => i % step === 0 || i === months.length - 1)
    .map((m) => ({
      date: m.date,
      revenue: Math.round(m.totalMrr),
      expenses: Math.round(m.totalExpense),
      netBurn: Math.round(m.netBurn),
    }));
}

// ============================================================================
// Dashboard Page
// ============================================================================

export default function DashboardPage() {
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadForecast() {
      try {
        setLoading(true);
        setError(null);

        const planRes = await fetch("/api/plans/current");
        const planData = await planRes.json();
        if (!planData.success)
          throw new Error(planData.error || "Failed to load plan");

        const forecastRes = await fetch(
          `/api/forecast?planId=${planData.data.id}`
        );
        const forecastData = await forecastRes.json();
        if (!forecastData.success)
          throw new Error(forecastData.error || "Failed to compute forecast");

        setForecast(forecastData.data);
      } catch (err) {
        console.error("Failed to load forecast:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadForecast();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Computing forecast...</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const metrics = forecast ? buildMetrics(forecast.summary) : [];
  const arrChartData = forecast ? buildArrChartData(forecast.months) : [];
  const burnChartData = forecast ? buildBurnChartData(forecast.months) : [];
  const hasData = forecast && forecast.months.length > 0;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="space-y-8">
          <PageHeader
            title="Dashboard"
            subtitle="Key SaaS metrics for your current plan."
            actions={
              <div className="flex items-center gap-3">
                <Link
                  href="/app/assumptions"
                  className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Edit assumptions
                </Link>
              </div>
            }
          />

          {/* Error banner */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ── Metrics Grid ── */}
          <section aria-labelledby="metrics-heading">
            <h2 id="metrics-heading" className="sr-only">
              Key Performance Metrics
            </h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {metrics.map((metric) => (
                <SaasMetricCard
                  key={metric.id}
                  name={metric.name}
                  value={metric.value}
                  helper={metric.helper}
                  isPlaceholder={!hasData}
                />
              ))}
            </div>
          </section>

          {/* ── Charts Section ── */}
          <section className="space-y-6 border-t border-slate-200 pt-6">
            {!hasData && (
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                  <svg
                    className="h-4 w-4 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    Add revenue streams and expenses to see real metrics
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Configure your{" "}
                    <Link
                      href="/app/revenue"
                      className="text-indigo-600 hover:underline"
                    >
                      revenue streams
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/app/expenses"
                      className="text-indigo-600 hover:underline"
                    >
                      expenses
                    </Link>{" "}
                    to populate these charts with forecasted data.
                  </p>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Forecast Overview
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Visual trends for ARR growth and cash runway.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard
                title="ARR by Channel"
                description="Track momentum across PLG, sales, and partner revenue."
                data={arrChartData}
                series={[
                  {
                    dataKey: "plgArr",
                    name: "PLG",
                    color: "#10b981",
                    stackId: "arr",
                  },
                  {
                    dataKey: "salesArr",
                    name: "Sales",
                    color: "#3b82f6",
                    stackId: "arr",
                  },
                  {
                    dataKey: "partnerArr",
                    name: "Partners",
                    color: "#8b5cf6",
                    stackId: "arr",
                  },
                ]}
              />
              <ChartCard
                title="Revenue vs. Expenses"
                description="Model burn rate and path to profitability."
                data={burnChartData}
                series={[
                  {
                    dataKey: "revenue",
                    name: "MRR",
                    color: "#10b981",
                  },
                  {
                    dataKey: "expenses",
                    name: "Expenses",
                    color: "#ef4444",
                  },
                ]}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
