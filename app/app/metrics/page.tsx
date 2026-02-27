"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  BarChart3,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatCurrency } from "@/lib/assumptions";
import { Skeleton, FormSectionSkeleton } from "@/components/ui/Skeleton";
import { exportForecastCSV, exportSummaryPDF } from "@/lib/export";
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

// ============================================================================
// Metrics Page
// ============================================================================

export default function MetricsPage() {
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
        console.error("Failed to load metrics:", err);
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
        <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <FormSectionSkeleton key={i} />
          ))}
        </div>
      </main>
    );
  }

  const months = forecast?.months ?? [];
  const summary = forecast?.summary;
  const last = months.length > 0 ? months[months.length - 1] : null;
  const month6 = months.length > 6 ? months[5] : null;
  const month12 = months.length > 12 ? months[11] : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="space-y-8">
          <PageHeader
            title="Metrics"
            subtitle="Deep-dive into your projected SaaS metrics across the forecast period."
            actions={
              <div className="flex items-center gap-2">
                {forecast && (
                  <>
                    <button
                      onClick={() => exportForecastCSV(forecast)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={() => exportSummaryPDF(forecast)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      Print PDF
                    </button>
                  </>
                )}
                <Link
                  href="/app/assumptions"
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                >
                  Edit assumptions
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            }
          />

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!summary || !last ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No forecast data yet
              </h3>
              <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                Configure your{" "}
                <Link
                  href="/app/revenue"
                  className="text-indigo-600 hover:underline"
                >
                  revenue streams
                </Link>
                ,{" "}
                <Link
                  href="/app/expenses"
                  className="text-indigo-600 hover:underline"
                >
                  expenses
                </Link>
                , and{" "}
                <Link
                  href="/app/assumptions"
                  className="text-indigo-600 hover:underline"
                >
                  assumptions
                </Link>{" "}
                to see projected metrics.
              </p>
            </div>
          ) : (
            <>
              {/* ── Revenue Metrics ── */}
              <MetricSection
                title="Revenue"
                icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
                iconBg="bg-emerald-50"
              >
                <MetricRow
                  label="Projected ARR (end of period)"
                  value={formatCompact(summary.projectedArr)}
                />
                <MetricRow
                  label="Projected MRR (end of period)"
                  value={formatCompact(summary.projectedMrr)}
                />
                {month6 && (
                  <MetricRow
                    label="MRR at Month 6"
                    value={formatCompact(month6.totalMrr)}
                  />
                )}
                {month12 && (
                  <MetricRow
                    label="MRR at Month 12"
                    value={formatCompact(month12.totalMrr)}
                  />
                )}
                <MetricRow
                  label="Net New ARR (over period)"
                  value={formatCompact(summary.netNewArr)}
                />
                <MetricRow
                  label="Net Revenue Retention (NRR)"
                  value={formatPct(summary.annualNrr)}
                  highlight={summary.annualNrr >= 100}
                />
                <MetricRow
                  label="Gross Revenue Retention (GRR)"
                  value={formatPct(summary.annualGrr)}
                  highlight={summary.annualGrr >= 90}
                />
              </MetricSection>

              {/* ── Revenue by Channel ── */}
              <MetricSection
                title="Revenue by Channel"
                icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
                iconBg="bg-blue-50"
              >
                <MetricRow
                  label="PLG MRR (end of period)"
                  value={formatCompact(last.plgMrr)}
                />
                <MetricRow
                  label="Sales MRR (end of period)"
                  value={formatCompact(last.salesMrr)}
                />
                <MetricRow
                  label="Partners MRR (end of period)"
                  value={formatCompact(last.partnerMrr)}
                />
                <div className="border-t border-slate-100 my-2" />
                <MetricRow
                  label="PLG Customers"
                  value={last.plgCustomers.toString()}
                />
                <MetricRow
                  label="Sales Customers"
                  value={last.salesCustomers.toString()}
                />
                <MetricRow
                  label="Partner Customers"
                  value={last.partnerCustomers.toString()}
                />
              </MetricSection>

              {/* ── Customer Metrics ── */}
              <MetricSection
                title="Customers & Acquisition"
                icon={<Users className="h-5 w-5 text-violet-600" />}
                iconBg="bg-violet-50"
              >
                <MetricRow
                  label="Total Customers (end of period)"
                  value={summary.totalCustomers.toString()}
                />
                <MetricRow
                  label="Customer Acquisition Cost (CAC)"
                  value={formatCompact(summary.cac)}
                />
                <MetricRow
                  label="CAC Payback Period"
                  value={`${summary.cacPaybackMonths.toFixed(0)} months`}
                  highlight={summary.cacPaybackMonths <= 12}
                />
                <MetricRow
                  label="LTV / CAC Ratio"
                  value={`${summary.ltvCacRatio.toFixed(1)}x`}
                  highlight={
                    summary.ltvCacRatio >= 3 && summary.ltvCacRatio <= 5
                  }
                />
              </MetricSection>

              {/* ── Expense & Burn Metrics ── */}
              <MetricSection
                title="Expenses & Burn"
                icon={<DollarSign className="h-5 w-5 text-rose-600" />}
                iconBg="bg-rose-50"
              >
                <MetricRow
                  label="Monthly Expenses (end of period)"
                  value={formatCompact(last.totalExpense)}
                />
                <MetricRow
                  label="Headcount Expense"
                  value={formatCompact(last.headcountExpense)}
                />
                <MetricRow
                  label="Non-headcount Expense"
                  value={formatCompact(last.nonHeadcountExpense)}
                />
                <div className="border-t border-slate-100 my-2" />
                <MetricRow
                  label="Monthly Net Burn"
                  value={formatCompact(summary.monthlyBurn)}
                  negative={summary.monthlyBurn > 0}
                />
                <MetricRow
                  label="Burn Multiple"
                  value={`${summary.burnMultiple.toFixed(1)}x`}
                  highlight={summary.burnMultiple > 0 && summary.burnMultiple < 2}
                />
                <MetricRow
                  label="Rule of 40"
                  value={formatPct(summary.ruleOf40)}
                  highlight={summary.ruleOf40 >= 40}
                />
              </MetricSection>

              {/* ── Monthly Forecast Table ── */}
              <MonthlyForecastTable months={months} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

// ============================================================================
// Reusable Components
// ============================================================================

function MetricSection({
  title,
  icon,
  iconBg,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4 bg-slate-50/50">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}
        >
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="divide-y divide-slate-100 px-6">{children}</div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  highlight,
  negative,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  negative?: boolean;
}) {
  let valueClass = "text-slate-900";
  if (highlight) valueClass = "text-emerald-600";
  if (negative) valueClass = "text-rose-600";

  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}

// ============================================================================
// Monthly Forecast Table
// ============================================================================

function MonthlyForecastTable({ months }: { months: ForecastMonth[] }) {
  // Show a sampled subset for readability
  const step = months.length > 12 ? Math.ceil(months.length / 12) : 1;
  const sampled = months.filter(
    (_, i) => i % step === 0 || i === months.length - 1
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4 bg-slate-50/50">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
          <BarChart3 className="h-4 w-4 text-slate-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">
          Monthly Forecast
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Month
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                MRR
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                ARR
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Customers
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Expenses
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Net Burn
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {sampled.map((m) => (
              <tr key={m.date} className="hover:bg-slate-50/60">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                  {m.date}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-right text-slate-700 tabular-nums">
                  {formatCompact(m.totalMrr)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-right text-slate-700 tabular-nums">
                  {formatCompact(m.totalArr)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-right text-slate-700 tabular-nums">
                  {m.totalCustomers}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-right text-slate-700 tabular-nums">
                  {formatCompact(m.totalExpense)}
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-3 text-sm text-right font-medium tabular-nums ${
                    m.netBurn > 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {m.netBurn > 0 ? "-" : "+"}
                  {formatCompact(Math.abs(m.netBurn))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
