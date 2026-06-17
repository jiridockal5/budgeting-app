"use client";

import Link from "next/link";
import { Timer, ArrowRight } from "lucide-react";
import { useMetricsForecast } from "../useMetricsForecast";
import { MetricsPageShell } from "@/components/metrics/MetricsPageShell";
import { MonthlyMatrixTable } from "@/components/metrics/MonthlyMatrixTable";
import { PeriodSummaryBar } from "@/components/metrics/PeriodSummaryBar";
import {
  SAAS_GROWTH_ROWS,
  SAAS_CASH_ROWS,
} from "@/components/metrics/metricRows";
import { WaterfallChart } from "@/components/dashboard/WaterfallChart";
import { NetNewArrMixChart } from "@/components/metrics/NetNewArrMixChart";

export default function SaasMetricsPage() {
  const {
    forecast,
    totalMonths,
    periodMonths,
    setPeriodMonths,
    loading,
    error,
    displayMonths,
    summary,
    last,
  } = useMetricsForecast();

  return (
    <MetricsPageShell
      title="SaaS Metrics"
      subtitle="Investor and operator KPIs — month-by-month across the forecast period."
      loading={loading}
      error={error}
      forecast={forecast}
      totalMonths={totalMonths}
      periodMonths={periodMonths}
      monthCount={displayMonths.length}
      onPeriodChange={setPeriodMonths}
      hasData={Boolean(summary && last)}
    >
      {summary && last && displayMonths.length > 0 && (
        <>
          <PeriodSummaryBar summary={summary} />

          <MonthlyMatrixTable
            title="SaaS Metrics by Month"
            subtitle={`${displayMonths.length} months · growth, revenue, and customers`}
            months={displayMonths}
            rows={SAAS_GROWTH_ROWS}
          />

          <MonthlyMatrixTable
            title="Cash & Burn by Month"
            subtitle={`${displayMonths.length} months · cash in, expenses, and runway`}
            months={displayMonths}
            rows={SAAS_CASH_ROWS}
          />

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
                <Timer className="h-4 w-4 text-neutral-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  Runway
                </p>
                <p className="text-sm text-neutral-500">
                  {summary.runwayMonths >= 999
                    ? "Cash-positive — no runway limit"
                    : `${Math.round(summary.runwayMonths)} months at current burn`}
                </p>
              </div>
            </div>
            <Link
              href="/app/runway"
              className="inline-flex items-center gap-2 text-sm font-medium text-turquoise-600 hover:text-turquoise-500"
            >
              View runway details
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <WaterfallChart months={displayMonths} />
            <NetNewArrMixChart
              mix={summary.netNewArrMix}
              totalNewMrr={summary.totalNewMrr}
              totalExpansionMrr={summary.totalExpansionMrr}
              totalChurnedMrr={summary.totalChurnedMrr}
            />
          </div>
        </>
      )}
    </MetricsPageShell>
  );
}
