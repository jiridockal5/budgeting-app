"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import type { Expense, Person } from "@prisma/client";
import { SaasMetricCard } from "@/components/dashboard/SaasMetricCard";
import { Skeleton, MetricCardSkeleton, ChartCardSkeleton } from "@/components/ui/Skeleton";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { WaterfallChart } from "@/components/dashboard/WaterfallChart";
import { StackedExpenseChart } from "@/components/dashboard/StackedExpenseChart";
import { OnboardingChecklist, type OnboardingStatus } from "@/components/dashboard/OnboardingChecklist";
import { PeriodTabs } from "@/components/dashboard/PeriodTabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatCurrency, normalizeAssumptions, DEFAULT_ASSUMPTIONS, type GlobalAssumptions } from "@/lib/assumptions";
import { parseApiError } from "@/lib/apiErrorUtils";
import { fetchJsonEnvelope } from "@/lib/clientFetch";
import { computeSummary, type ForecastResult, type ForecastMonth, type AssumptionsInput } from "@/lib/revenueForecast";

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
      helper: "Total GTM spend divided by new customers acquired.",
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
  const [assumptions, setAssumptions] = useState<GlobalAssumptions | null>(null);
  const [totalMonths, setTotalMonths] = useState(24);
  const [periodMonths, setPeriodMonths] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadWarnings, setLoadWarnings] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingStatus>({
    hasAssumptions: false,
    hasRevenue: false,
    hasExpenses: false,
  });

  useEffect(() => {
    async function loadForecast() {
      try {
        setLoading(true);
        setError(null);
        setLoadWarnings(null);

        const planResult = await fetchJsonEnvelope<{
          id: string;
          months: number;
        }>("/api/plans/current");
        if (!planResult.ok) {
          throw new Error(planResult.error);
        }
        const id = planResult.data.id;
        setPlanId(id);
        setTotalMonths(planResult.data.months);

        const [fr, ar, rr, pr, er] = await Promise.all([
          fetchJsonEnvelope<ForecastResult>(
            `/api/forecast?planId=${encodeURIComponent(id)}`
          ),
          fetchJsonEnvelope<
            GlobalAssumptions & { isDefault?: boolean }
          >(`/api/assumptions?planId=${encodeURIComponent(id)}`),
          fetchJsonEnvelope<{ isDefault: boolean }>(
            `/api/revenue?planId=${encodeURIComponent(id)}`
          ),
          fetchJsonEnvelope<Person[]>(
            `/api/people?planId=${encodeURIComponent(id)}`
          ),
          fetchJsonEnvelope<Expense[]>(
            `/api/expenses?planId=${encodeURIComponent(id)}`
          ),
        ]);

        const warnings: string[] = [];

        if (fr.ok) {
          setForecast(fr.data);
        } else {
          setForecast(null);
          warnings.push(`Forecast: ${fr.error}`);
        }

        if (ar.ok) {
          setAssumptions(normalizeAssumptions(ar.data));
        } else {
          setAssumptions(null);
          warnings.push(`Assumptions: ${ar.error}`);
        }

        if (!rr.ok) {
          warnings.push(`Revenue: ${rr.error}`);
        }

        if (!pr.ok) {
          warnings.push(`Headcount: ${pr.error}`);
        }
        if (!er.ok) {
          warnings.push(`Operating expenses: ${er.error}`);
        }

        setOnboarding({
          hasAssumptions: ar.ok && ar.data.isDefault === false,
          hasRevenue: rr.ok && rr.data.isDefault === false,
          hasExpenses:
            (pr.ok && pr.data.length > 0) || (er.ok && er.data.length > 0),
        });

        if (warnings.length > 0) {
          setLoadWarnings(warnings.join(" · "));
        }
      } catch (err) {
        console.error("Failed to load forecast:", err);
        setError(parseApiError(err));
      } finally {
        setLoading(false);
      }
    }

    loadForecast();
  }, []);

  // Hooks must run unconditionally (before any early return)
  const displayMonths = useMemo(() => {
    if (!forecast) return [];
    if (periodMonths === null) return forecast.months;
    return forecast.months.slice(0, periodMonths);
  }, [forecast, periodMonths]);

  const displaySummary = useMemo(() => {
    if (!forecast || displayMonths.length === 0) return forecast?.summary ?? null;
    if (periodMonths === null) return forecast.summary;
    const assumptionsInput = (assumptions ?? DEFAULT_ASSUMPTIONS) as AssumptionsInput;
    return computeSummary(displayMonths, assumptionsInput);
  }, [forecast, displayMonths, periodMonths, assumptions]);

  const metrics = displaySummary ? buildMetrics(displaySummary) : [];
  const arrChartData = displayMonths.length > 0 ? buildArrChartData(displayMonths) : [];
  const burnChartData = displayMonths.length > 0 ? buildBurnChartData(displayMonths) : [];
  const hasData = forecast && displayMonths.length > 0;

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
            <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="shrink-0 font-medium text-red-500 hover:text-red-700"
              >
                Dismiss
              </button>
            </div>
          )}

          {loadWarnings && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span>Some data could not be loaded: {loadWarnings}</span>
              <button
                type="button"
                onClick={() => setLoadWarnings(null)}
                className="shrink-0 font-medium text-amber-700 hover:text-amber-900"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Onboarding */}
          <OnboardingChecklist status={onboarding} planId={planId} />

          {/* ── Period Filter ── */}
          <div className="flex items-center justify-between">
            <PeriodTabs
              totalMonths={totalMonths}
              selected={periodMonths}
              onChange={setPeriodMonths}
            />
            {periodMonths !== null && (
              <span className="text-sm text-slate-500">
                Showing first {periodMonths} months
              </span>
            )}
          </div>

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
                    Complete setup to see metrics and charts
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Set your{" "}
                    <Link
                      href="/app/assumptions"
                      className="text-indigo-600 hover:underline"
                    >
                      assumptions
                    </Link>
                    ,{" "}
                    <Link
                      href="/app/revenue"
                      className="text-indigo-600 hover:underline"
                    >
                      revenue streams
                    </Link>
                    , and{" "}
                    <Link
                      href="/app/expenses"
                      className="text-indigo-600 hover:underline"
                    >
                      expenses
                    </Link>{" "}
                    — then your dashboard fills in with forecasted data.
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

            {hasData && (
              <div className="grid gap-4 lg:grid-cols-2">
                <WaterfallChart months={displayMonths} />
                <StackedExpenseChart months={displayMonths} />
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
