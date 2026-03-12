"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  Upload,
  ArrowRight,
  Sparkles,
  TableProperties,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

// ============================================================================
// Mock data
// ============================================================================

const MOCK_MAPPING_ROWS = [
  {
    id: "1",
    importedLine: "602100 - AWS",
    suggestedCategory: "Hosting / Infrastructure",
    type: "Expense",
    confidence: 95,
    status: "mapped" as const,
  },
  {
    id: "2",
    importedLine: "Google Ads CZ",
    suggestedCategory: "Paid Marketing",
    type: "Expense",
    confidence: 88,
    status: "mapped" as const,
  },
  {
    id: "3",
    importedLine: "Payroll March",
    suggestedCategory: "Salaries",
    type: "Expense",
    confidence: 92,
    status: "mapped" as const,
  },
  {
    id: "4",
    importedLine: "Contractor - Pavel Novak",
    suggestedCategory: "Contractors",
    type: "Expense",
    confidence: 78,
    status: "review" as const,
  },
  {
    id: "5",
    importedLine: "Stripe revenue",
    suggestedCategory: "Subscription Revenue",
    type: "Revenue",
    confidence: 96,
    status: "mapped" as const,
  },
];

const MOCK_MONTHLY_DATA = [
  { category: "Salaries", janBudget: 42000, janActual: 39800, febBudget: 42000, febActual: 41500 },
  { category: "Hosting / Infra", janBudget: 8500, janActual: 9200, febBudget: 8500, febActual: 9800 },
  { category: "Paid Marketing", janBudget: 12000, janActual: 15200, febBudget: 12000, febActual: 16100 },
  { category: "Contractors", janBudget: 6000, janActual: 5800, febBudget: 6000, febActual: 6200 },
  { category: "Subscription Revenue", janBudget: 78000, janActual: 72400, febBudget: 80000, febActual: 69600 },
  { category: "Tools & Software", janBudget: 3200, janActual: 3100, febBudget: 3200, febActual: 3400 },
];

const MOCK_INSIGHTS = [
  {
    text: "Marketing spend is 18% above budget — driven by Google Ads scaling in CZ market.",
    type: "warning" as const,
  },
  {
    text: "Payroll is 5% below budget due to delayed Q1 hiring. Two roles still open.",
    type: "positive" as const,
  },
  {
    text: "Infrastructure costs grew 12% faster than planned — review AWS reserved instances.",
    type: "warning" as const,
  },
  {
    text: "Net burn is €20K above forecast — consider reforecasting with updated actuals.",
    type: "action" as const,
  },
];

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatVariance(budget: number, actual: number): { label: string; favorable: boolean } {
  const diff = actual - budget;
  const pct = budget !== 0 ? ((diff / Math.abs(budget)) * 100).toFixed(1) : "0.0";
  const sign = diff >= 0 ? "+" : "";
  return {
    label: `${sign}${formatCurrency(diff)} (${sign}${pct}%)`,
    favorable: diff <= 0,
  };
}

function confidenceColor(confidence: number): string {
  if (confidence >= 90) return "bg-emerald-50 text-emerald-700";
  if (confidence >= 80) return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-700";
}

// ============================================================================
// Actuals Page
// ============================================================================

export default function ActualsPage() {
  const [hasUploadedFile, setHasUploadedFile] = useState(false);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="space-y-8">
          <PageHeader
            title="Actuals"
            subtitle="Import accounting data and compare actuals vs budget"
          />

          <p className="text-sm text-slate-500 -mt-4">
            Use this module for variance analysis and reforecasting — upload your
            accounting export, map it to forecast categories, and spot where
            actuals diverge from plan.
          </p>

          {!hasUploadedFile ? (
            <EmptyState onUpload={() => setHasUploadedFile(true)} />
          ) : (
            <>
              <ExplainerCard />
              <UploadSection onUpload={() => setHasUploadedFile(true)} />
              <MappingSection />
              <VarianceSummaryCards />
              <MonthlyComparisonTable />
              <VarianceInsightsCard />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

// ============================================================================
// H. Empty State
// ============================================================================

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <ClipboardCheck className="mx-auto h-12 w-12 text-slate-300" />
      <h3 className="mt-4 text-lg font-semibold text-slate-900">
        No actuals imported yet
      </h3>
      <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
        Upload your accounting export to compare actual vs budget and identify
        variances. This helps you reforecast with real numbers instead of
        assumptions alone.
      </p>
      <button
        type="button"
        onClick={onUpload}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
      >
        <Upload className="h-4 w-4" />
        Upload Accounting Export
      </button>
    </div>
  );
}

// ============================================================================
// B. Explainer Card
// ============================================================================

function ExplainerCard() {
  const steps = [
    { num: "1", label: "Upload accounting export" },
    { num: "2", label: "Map rows to forecast categories" },
    { num: "3", label: "Review actual vs budget" },
    { num: "4", label: "Reforecast with real data" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50">
          <Info className="h-4 w-4 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            How actuals import works
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Compare your accounting data against your forecast to identify
            variances and improve future projections.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {steps.map((step, i) => (
              <div key={step.num} className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                  {step.num}
                </span>
                <span className="text-sm text-slate-700">{step.label}</span>
                {i < steps.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// C. Upload Section
// ============================================================================

function UploadSection({ onUpload }: { onUpload: () => void }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
          <Upload className="h-4 w-4 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Upload Accounting Export
          </h2>
          <p className="text-sm text-slate-500">
            Import your latest accounting data to compare against budget
          </p>
        </div>
      </div>

      <div
        onClick={onUpload}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 transition hover:border-indigo-300 hover:bg-indigo-50/30"
      >
        <Upload className="h-8 w-8 text-slate-400" />
        <p className="mt-3 text-sm font-medium text-slate-700">
          Drag and drop your file here, or click to browse
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Supported formats: CSV / XLSX
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Manual upload for now. Direct integrations coming later.
        </p>
        <button
          type="button"
          onClick={onUpload}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
        >
          <Upload className="h-4 w-4" />
          Upload File
        </button>
      </div>
    </section>
  );
}

// ============================================================================
// D. Mapping Section
// ============================================================================

function MappingSection() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100">
            <TableProperties className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Category Mapping
            </h2>
            <p className="text-sm text-slate-500">
              AI-suggested mappings from your accounting lines to forecast
              categories
            </p>
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-xs text-slate-500">5 lines imported</p>
          <p className="text-sm font-semibold text-slate-900">4 mapped, 1 to review</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Imported Account / Line
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Suggested Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {MOCK_MAPPING_ROWS.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                  {row.importedLine}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                  {row.suggestedCategory}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      row.type === "Revenue"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {row.type}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${confidenceColor(row.confidence)}`}
                  >
                    {row.confidence}%
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  {row.status === "mapped" ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mapped
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <Clock className="h-3.5 w-3.5" />
                      Review
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <button
                    type="button"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    {row.status === "review" ? "Review" : "Change"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ============================================================================
// E. Variance Summary Cards
// ============================================================================

function VarianceSummaryCards() {
  const cards = [
    {
      label: "Actual Revenue vs Budget",
      value: "€142K / €155K",
      variance: "-8.4%",
      favorable: false,
      icon: TrendingDown,
      helper: "Revenue is trailing budget by €13K",
    },
    {
      label: "Actual Expenses vs Budget",
      value: "€98K / €91K",
      variance: "+7.7%",
      favorable: false,
      icon: TrendingUp,
      helper: "Expenses exceeded budget by €7K",
    },
    {
      label: "Burn Variance",
      value: "+€20K",
      variance: "over plan",
      favorable: false,
      icon: AlertTriangle,
      helper: "Net burn is higher than forecasted",
    },
    {
      label: "Biggest Overspend",
      value: "Paid Marketing",
      variance: "+32%",
      favorable: false,
      icon: TrendingUp,
      helper: "Google Ads CZ scaling drove overspend",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {card.label}
            </span>
            <card.icon
              className={`h-4 w-4 ${card.favorable ? "text-emerald-500" : "text-rose-500"}`}
            />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-slate-900">
              {card.value}
            </span>
            <span
              className={`text-sm font-semibold ${card.favorable ? "text-emerald-600" : "text-rose-600"}`}
            >
              {card.variance}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            {card.helper}
          </p>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// F. Monthly Actual vs Budget Table
// ============================================================================

function MonthlyComparisonTable() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
            <TableProperties className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Monthly Actual vs Budget
            </h2>
            <p className="text-sm text-slate-500">
              Side-by-side comparison of budgeted and actual amounts
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Category
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Jan Budget
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Jan Actual
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Jan Variance
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Feb Budget
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Feb Actual
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Feb Variance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {MOCK_MONTHLY_DATA.map((row) => {
              const janVar = formatVariance(row.janBudget, row.janActual);
              const febVar = formatVariance(row.febBudget, row.febActual);
              const isRevenue = row.category === "Subscription Revenue";

              return (
                <tr key={row.category} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                    {row.category}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm tabular-nums text-slate-600">
                    {formatCurrency(row.janBudget)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm tabular-nums text-slate-900">
                    {formatCurrency(row.janActual)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-6 py-4 text-right text-sm font-medium tabular-nums ${
                      isRevenue
                        ? janVar.favorable
                          ? "text-emerald-600"
                          : "text-rose-600"
                        : janVar.favorable
                          ? "text-emerald-600"
                          : "text-rose-600"
                    }`}
                  >
                    {janVar.label}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm tabular-nums text-slate-600">
                    {formatCurrency(row.febBudget)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm tabular-nums text-slate-900">
                    {formatCurrency(row.febActual)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-6 py-4 text-right text-sm font-medium tabular-nums ${
                      isRevenue
                        ? febVar.favorable
                          ? "text-emerald-600"
                          : "text-rose-600"
                        : febVar.favorable
                          ? "text-emerald-600"
                          : "text-rose-600"
                    }`}
                  >
                    {febVar.label}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ============================================================================
// G. Variance Insights Card
// ============================================================================

function VarianceInsightsCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50">
          <Sparkles className="h-4 w-4 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-900">
            Variance Insights
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            AI-generated observations based on your actual vs budget data
          </p>
          <ul className="mt-4 space-y-3">
            {MOCK_INSIGHTS.map((insight, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                    insight.type === "warning"
                      ? "bg-amber-100"
                      : insight.type === "positive"
                        ? "bg-emerald-100"
                        : "bg-indigo-100"
                  }`}
                >
                  {insight.type === "warning" ? (
                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                  ) : insight.type === "positive" ? (
                    <TrendingDown className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <ArrowRight className="h-3 w-3 text-indigo-600" />
                  )}
                </span>
                <span className="text-sm text-slate-700 leading-relaxed">
                  {insight.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
