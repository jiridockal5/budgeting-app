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
      title="Budget Metrics"
      subtitle="Budget health and cash-flow KPIs — month-by-month across the forecast period."
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
            title="Budget Metrics by Month"
            subtitle={`${displayMonths.length} months · income, changes, and source counts`}
            months={displayMonths}
            rows={SAAS_GROWTH_ROWS}
          />

          <MonthlyMatrixTable
            title="Cash Flow by Month"
            subtitle={`${displayMonths.length} months · income, expenses, and cash cushion`}
            months={displayMonths}
            rows={SAAS_CASH_ROWS}
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                <Timer className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Cash cushion
                </p>
                <p className="text-sm text-slate-500">
                  {summary.runwayMonths >= 999
                    ? "Cash-positive — no cushion limit"
                    : `${Math.round(summary.runwayMonths)} months at current spending rate`}
                </p>
              </div>
            </div>
            <Link
              href="/app/runway"
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View cash-flow details
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
