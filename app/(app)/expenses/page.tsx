"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Settings2,
  ArrowRight,
  Users,
  Receipt,
  Plus,
  Trash2,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  DEFAULT_ASSUMPTIONS,
  formatCurrency,
  formatPercentage,
} from "@/lib/assumptions";
import {
  ExpenseCategory,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_SHORT_LABELS,
  EXPENSE_CATEGORIES,
  HeadcountRow,
  NonHeadcountExpenseRow,
  EXPENSE_FREQUENCY_OPTIONS,
  formatFrequency,
} from "@/lib/expenses";

// TODO:
// - Replace local state with data loaded from Prisma for the current plan.
// - On save, persist headcount and non-headcount expenses via server actions or /api endpoints.
// - Use GlobalAssumptions (salaryTaxRate, salaryGrowthRate, inflationRate) when computing forecasted monthly costs.
// - Add validation for inputs (positive numbers, valid date ranges, etc.).
// - Consider optimistic updates with rollback on error.

/**
 * Generate a simple unique ID for local state management
 */
function generateId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get current month as YYYY-MM string
 */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Expenses Page
 *
 * Configure headcount and non-headcount costs for the financial model.
 * Uses global assumptions for salary tax, growth, and inflation calculations.
 */
export default function ExpensesPage() {
  // ============================================================================
  // Headcount State
  // ============================================================================
  // TODO: Replace with data loaded from Prisma for the current plan
  const [headcountRows, setHeadcountRows] = useState<HeadcountRow[]>([
    // Seed with one example row
    {
      id: generateId(),
      role: "Senior Software Engineer",
      category: "rnd",
      baseSalary: 6000,
      fte: 1.0,
      startMonth: getCurrentMonth(),
    },
  ]);

  const [headcountForm, setHeadcountForm] = useState<Omit<HeadcountRow, "id">>({
    role: "",
    category: "rnd",
    baseSalary: 0,
    fte: 1.0,
    startMonth: getCurrentMonth(),
  });

  // ============================================================================
  // Non-headcount State
  // ============================================================================
  // TODO: Replace with data loaded from Prisma for the current plan
  const [nonHeadcountRows, setNonHeadcountRows] = useState<
    NonHeadcountExpenseRow[]
  >([
    // Seed with example rows
    {
      id: generateId(),
      name: "AWS Infrastructure",
      category: "cos",
      amount: 2500,
      frequency: "monthly",
      startMonth: getCurrentMonth(),
    },
    {
      id: generateId(),
      name: "Google Ads",
      category: "gtm",
      amount: 5000,
      frequency: "monthly",
      startMonth: getCurrentMonth(),
    },
  ]);

  const [nonHeadcountForm, setNonHeadcountForm] = useState<
    Omit<NonHeadcountExpenseRow, "id">
  >({
    name: "",
    category: "ops",
    amount: 0,
    frequency: "monthly",
    startMonth: getCurrentMonth(),
    endMonth: undefined,
  });

  // ============================================================================
  // Headcount Handlers
  // ============================================================================
  const handleAddHeadcount = () => {
    if (!headcountForm.role.trim() || headcountForm.baseSalary <= 0) return;

    const newRow: HeadcountRow = {
      ...headcountForm,
      id: generateId(),
    };

    setHeadcountRows((prev) => [...prev, newRow]);
    setHeadcountForm({
      role: "",
      category: "rnd",
      baseSalary: 0,
      fte: 1.0,
      startMonth: getCurrentMonth(),
    });

    // TODO: Persist to database via server action or API
  };

  const handleDeleteHeadcount = (id: string) => {
    setHeadcountRows((prev) => prev.filter((row) => row.id !== id));
    // TODO: Delete from database via server action or API
  };

  // ============================================================================
  // Non-headcount Handlers
  // ============================================================================
  const handleAddNonHeadcount = () => {
    if (!nonHeadcountForm.name.trim() || nonHeadcountForm.amount <= 0) return;

    const newRow: NonHeadcountExpenseRow = {
      ...nonHeadcountForm,
      id: generateId(),
    };

    setNonHeadcountRows((prev) => [...prev, newRow]);
    setNonHeadcountForm({
      name: "",
      category: "ops",
      amount: 0,
      frequency: "monthly",
      startMonth: getCurrentMonth(),
      endMonth: undefined,
    });

    // TODO: Persist to database via server action or API
  };

  const handleDeleteNonHeadcount = (id: string) => {
    setNonHeadcountRows((prev) => prev.filter((row) => row.id !== id));
    // TODO: Delete from database via server action or API
  };

  // ============================================================================
  // Summary Calculations
  // ============================================================================
  const headcountSummary = useMemo(() => {
    const totalBaseSalary = headcountRows.reduce(
      (sum, row) => sum + row.baseSalary * row.fte,
      0
    );
    return {
      count: headcountRows.length,
      totalBaseSalary,
    };
  }, [headcountRows]);

  const nonHeadcountSummary = useMemo(() => {
    // Placeholder: Convert all to monthly equivalent for display
    // Annual costs divided by 12, one-time shown as-is (would need amortization logic)
    const totalMonthlyEquivalent = nonHeadcountRows.reduce((sum, row) => {
      if (row.frequency === "annual") return sum + row.amount / 12;
      if (row.frequency === "one_time") return sum; // Skip one-time for monthly view
      return sum + row.amount;
    }, 0);
    return {
      count: nonHeadcountRows.length,
      totalMonthlyEquivalent,
    };
  }, [nonHeadcountRows]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <PageHeader
            title="Expenses"
            subtitle="Configure headcount and non-headcount costs for your plan."
          />

          {/* Cost Assumptions Snapshot */}
          <CostAssumptionsSnapshot />

          {/* Headcount Section */}
          <HeadcountSection
            rows={headcountRows}
            form={headcountForm}
            setForm={setHeadcountForm}
            onAdd={handleAddHeadcount}
            onDelete={handleDeleteHeadcount}
            summary={headcountSummary}
          />

          {/* Non-headcount Section */}
          <NonHeadcountSection
            rows={nonHeadcountRows}
            form={nonHeadcountForm}
            setForm={setNonHeadcountForm}
            onAdd={handleAddNonHeadcount}
            onDelete={handleDeleteNonHeadcount}
            summary={nonHeadcountSummary}
          />

          {/* Info Card */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                <Info className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  How expense categories work
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Categorizing expenses into COS, GTM, R&D, CS, and Ops allows
                  us to compute key SaaS metrics: gross margin (revenue minus
                  COS), sales efficiency (GTM spend vs new ARR), and R&D
                  investment ratio. These metrics help investors and operators
                  benchmark performance against industry standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ============================================================================
// Cost Assumptions Snapshot
// ============================================================================

/**
 * Read-only snapshot of cost-related global assumptions
 */
function CostAssumptionsSnapshot() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
            <Settings2 className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Cost Assumptions
            </h2>
            <p className="text-xs text-slate-500">
              These values adjust headcount and cost forecasts
            </p>
          </div>
        </div>

        <Link
          href="/app/assumptions"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Edit global assumptions
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SnapshotMetric
            label="Salary Tax Rate"
            value={formatPercentage(DEFAULT_ASSUMPTIONS.salaryTaxRate)}
            helper="Added on top of gross salary"
          />
          <SnapshotMetric
            label="Salary Growth"
            value={formatPercentage(DEFAULT_ASSUMPTIONS.salaryGrowthRate) + " / yr"}
            helper="Annual salary increase"
          />
          <SnapshotMetric
            label="Inflation Rate"
            value={formatPercentage(DEFAULT_ASSUMPTIONS.inflationRate) + " / yr"}
            helper="Applied to non-salary costs"
          />
        </div>
      </div>
    </div>
  );
}

function SnapshotMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="text-center sm:text-left">
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{helper}</p>
    </div>
  );
}

// ============================================================================
// Headcount Section
// ============================================================================

interface HeadcountSectionProps {
  rows: HeadcountRow[];
  form: Omit<HeadcountRow, "id">;
  setForm: React.Dispatch<React.SetStateAction<Omit<HeadcountRow, "id">>>;
  onAdd: () => void;
  onDelete: (id: string) => void;
  summary: { count: number; totalBaseSalary: number };
}

function HeadcountSection({
  rows,
  form,
  setForm,
  onAdd,
  onDelete,
  summary,
}: HeadcountSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100">
            <Users className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Headcount</h2>
            <p className="text-sm text-slate-500">
              People costs — adjusted by salary tax, growth & inflation
            </p>
          </div>
        </div>
        {summary.count > 0 && (
          <div className="hidden sm:block text-right">
            <p className="text-xs text-slate-500">
              {summary.count} role{summary.count !== 1 ? "s" : ""}
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {formatCurrency(summary.totalBaseSalary)}/mo base
            </p>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Base Salary
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                FTE
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Start Month
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-sm text-slate-500"
                >
                  No headcount added yet. Add your first role below.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                    {row.role}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {EXPENSE_CATEGORY_SHORT_LABELS[row.category]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                    {formatCurrency(row.baseSalary)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {row.fte.toFixed(1)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {row.startMonth}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onDelete(row.id)}
                      className="inline-flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only">Delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Form */}
      <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Role
            </label>
            <input
              type="text"
              value={form.role}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, role: e.target.value }))
              }
              placeholder="e.g. Product Designer"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  category: e.target.value as ExpenseCategory,
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {EXPENSE_CATEGORY_SHORT_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Base Salary (€/mo)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={form.baseSalary || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  baseSalary: parseFloat(e.target.value) || 0,
                }))
              }
              placeholder="5000"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              FTE
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={form.fte}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  fte: parseFloat(e.target.value) || 1,
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Start
              </label>
              <input
                type="month"
                value={form.startMonth}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, startMonth: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <button
              type="button"
              onClick={onAdd}
              disabled={!form.role.trim() || form.baseSalary <= 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Headcount costs will be adjusted using salary tax (
          {formatPercentage(DEFAULT_ASSUMPTIONS.salaryTaxRate)}), annual growth
          ({formatPercentage(DEFAULT_ASSUMPTIONS.salaryGrowthRate)}), and
          inflation ({formatPercentage(DEFAULT_ASSUMPTIONS.inflationRate)})
          assumptions.
        </p>
      </div>
    </section>
  );
}

// ============================================================================
// Non-headcount Section
// ============================================================================

interface NonHeadcountSectionProps {
  rows: NonHeadcountExpenseRow[];
  form: Omit<NonHeadcountExpenseRow, "id">;
  setForm: React.Dispatch<
    React.SetStateAction<Omit<NonHeadcountExpenseRow, "id">>
  >;
  onAdd: () => void;
  onDelete: (id: string) => void;
  summary: { count: number; totalMonthlyEquivalent: number };
}

function NonHeadcountSection({
  rows,
  form,
  setForm,
  onAdd,
  onDelete,
  summary,
}: NonHeadcountSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
            <Receipt className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Non-headcount costs
            </h2>
            <p className="text-sm text-slate-500">
              SaaS tools, marketing spend, contractors, and other operational
              costs
            </p>
          </div>
        </div>
        {summary.count > 0 && (
          <div className="hidden sm:block text-right">
            <p className="text-xs text-slate-500">
              {summary.count} cost{summary.count !== 1 ? "s" : ""}
            </p>
            <p className="text-sm font-semibold text-slate-900">
              ~{formatCurrency(summary.totalMonthlyEquivalent)}/mo
            </p>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Frequency
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Start
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                End
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-sm text-slate-500"
                >
                  No costs added yet. Add your first expense below.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                    {row.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {EXPENSE_CATEGORY_SHORT_LABELS[row.category]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                    {formatCurrency(row.amount)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {formatFrequency(row.frequency)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {row.startMonth}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {row.endMonth || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onDelete(row.id)}
                      className="inline-flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only">Delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Form */}
      <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. Intercom, AWS"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  category: e.target.value as ExpenseCategory,
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {EXPENSE_CATEGORY_SHORT_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Amount (€)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={form.amount || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  amount: parseFloat(e.target.value) || 0,
                }))
              }
              placeholder="1000"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Frequency
            </label>
            <select
              value={form.frequency}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  frequency: e.target.value as NonHeadcountExpenseRow["frequency"],
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {EXPENSE_FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Start
            </label>
            <input
              type="month"
              value={form.startMonth}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, startMonth: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                End (opt)
              </label>
              <input
                type="month"
                value={form.endMonth || ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    endMonth: e.target.value || undefined,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <button
              type="button"
              onClick={onAdd}
              disabled={!form.name.trim() || form.amount <= 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Classify each cost so we can later compute GTM efficiency, R&D spend,
          and gross margin. Non-headcount costs will be adjusted by inflation (
          {formatPercentage(DEFAULT_ASSUMPTIONS.inflationRate)}/yr).
        </p>
      </div>
    </section>
  );
}
