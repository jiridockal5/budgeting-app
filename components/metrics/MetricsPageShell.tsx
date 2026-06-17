"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PeriodTabs } from "@/components/dashboard/PeriodTabs";
import { Skeleton, FormSectionSkeleton } from "@/components/ui/Skeleton";
import { exportForecastCSV, exportSummaryPDF } from "@/lib/export";
import type { ForecastResult } from "@/lib/revenueForecast";
import { MetricsEmptyState } from "./MetricsEmptyState";

interface MetricsPageShellProps {
  title: string;
  subtitle: string;
  loading: boolean;
  error: string | null;
  forecast: ForecastResult | null;
  totalMonths: number;
  periodMonths: number | null;
  monthCount: number;
  onPeriodChange: (months: number | null) => void;
  hasData: boolean;
  children: ReactNode;
}

export function MetricsPageShell({
  title,
  subtitle,
  loading,
  error,
  forecast,
  totalMonths,
  periodMonths,
  monthCount,
  onPeriodChange,
  hasData,
  children,
}: MetricsPageShellProps) {
  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-[1600px] px-6 py-8 space-y-8">
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

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="space-y-8">
          <PageHeader
            title={title}
            subtitle={subtitle}
            actions={
              <div className="flex items-center gap-2">
                {forecast && (
                  <>
                    <button
                      onClick={() => exportForecastCSV(forecast)}
                      className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={() => exportSummaryPDF(forecast)}
                      className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50"
                    >
                      Print PDF
                    </button>
                  </>
                )}
                <Link
                  href="/app/assumptions"
                  className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
                >
                  Edit assumptions
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            }
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <PeriodTabs
              totalMonths={totalMonths}
              selected={periodMonths}
              onChange={onPeriodChange}
            />
            {hasData && monthCount > 0 && (
              <p className="text-sm text-neutral-500 sm:text-right">
                {periodMonths !== null
                  ? `${monthCount} monthly columns (months 1–${monthCount})`
                  : `${monthCount} monthly columns (full forecast)`}
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!hasData ? <MetricsEmptyState /> : children}
        </div>
      </div>
    </main>
  );
}
