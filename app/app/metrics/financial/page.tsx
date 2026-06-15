"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMetricsForecast } from "../useMetricsForecast";
import { MetricsPageShell } from "@/components/metrics/MetricsPageShell";
import { MonthlyMatrixTable } from "@/components/metrics/MonthlyMatrixTable";
import {
  FINANCIAL_ACCRUAL_ROWS,
  FINANCIAL_CASH_ROWS,
} from "@/components/metrics/metricRows";
import { PnlChart } from "@/components/metrics/PnlChart";
import { CategoryExpenseChart } from "@/components/metrics/CategoryExpenseChart";

export default function FinancialMetricsPage() {
  const [view, setView] = useState<"accrual" | "cash">("accrual");
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

  const rows = view === "accrual" ? FINANCIAL_ACCRUAL_ROWS : FINANCIAL_CASH_ROWS;

  return (
    <MetricsPageShell
      title="Financial Metrics"
      subtitle="Functional budget view by month — income, margin, operating expenses, and cash flow."
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setView("accrual")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  view === "accrual"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Accrual P&L
              </button>
              <button
                type="button"
                onClick={() => setView("cash")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  view === "cash"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cash Basis
              </button>
            </div>
            <Link
              href="/app/expenses/people"
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Tag expenses by category
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <MonthlyMatrixTable
            title={view === "accrual" ? "Monthly P&L" : "Monthly Cash Flow"}
            subtitle={`${displayMonths.length} months · one column per month`}
            months={displayMonths}
            rows={rows}
          />

          {view === "accrual" && (
            <>
              <PnlChart months={displayMonths} />
              <CategoryExpenseChart months={displayMonths} />
            </>
          )}
        </>
      )}
    </MetricsPageShell>
  );
}
