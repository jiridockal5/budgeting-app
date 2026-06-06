"use client";

import Link from "next/link";
import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Receipt,
  Settings2,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { MonthPicker } from "@/components/ui/MonthPicker";
import {
  type GlobalAssumptions,
  formatCurrency,
  formatPercentage,
} from "@/lib/assumptions";
import {
  COST_METHOD_LABELS,
  type CostMethod,
  type CostModel,
  describeCostModel,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_SHORT_LABELS,
  type ExpenseCategory,
  EXPENSE_FREQUENCY_OPTIONS,
  formatFrequency,
  type HeadcountRow,
  type NonHeadcountExpenseRow,
  PERSON_TYPE_LABELS,
  PERSON_TYPES,
  type PersonType,
  REVENUE_BASE_LABELS,
  type RevenueBase,
} from "@/lib/expenses";
import {
  resolveExpenseMonth,
  type MonthContext,
  type NonHeadcountInput,
} from "@/lib/revenueForecast";

/** True for methods whose value depends on the live forecast (revenue/headcount). */
export function methodNeedsForecast(method: CostMethod): boolean {
  return (
    method === "percentOfRevenue" ||
    method === "perCustomer" ||
    method === "perEmployee"
  );
}

/**
 * Build a deterministic monthly preview for a non-people cost, used in the
 * editor. Only fixed/growing (plus steps/overrides) can be previewed exactly;
 * revenue/usage-linked methods depend on the forecast and are described instead.
 */
export function buildPreviewSeries(
  row: Omit<NonHeadcountExpenseRow, "id">,
  forecastStart: string,
  months: number,
  inflationRate: number
): number[] {
  const input: NonHeadcountInput = {
    name: row.name || "Preview",
    category: row.category,
    amount: row.amount,
    frequency: row.frequency,
    startMonth: row.startMonth,
    endMonth: row.endMonth,
    config: row.config ?? null,
  };
  const series: number[] = [];
  for (let i = 0; i < months; i++) {
    const date = addMonthKey(forecastStart, i);
    const inflationGrowth = Math.pow(
      1 + inflationRate / 100,
      Math.floor(i / 12)
    );
    const ctx: MonthContext = {
      date,
      monthIndex: i,
      inflationGrowth,
      mrr: { total: 0, plg: 0, sales: 0, partners: 0 },
      activeCustomers: { total: 0, plg: 0, sales: 0, partners: 0 },
      newCustomers: { total: 0, plg: 0, sales: 0, partners: 0 },
      people: { totalFte: 0, totalCount: 0, fteByCategory: {}, countByCategory: {} },
    };
    series.push(resolveExpenseMonth(input, ctx));
  }
  return series;
}

/** Add N months to a "YYYY-MM" string. */
export function addMonthKey(start: string, count: number): string {
  const [year, month] = start.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1 + count, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function CostAssumptionsSnapshot({
  assumptions,
}: {
  assumptions: GlobalAssumptions;
}) {
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
              These defaults adjust payroll and operating cost forecasts
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <SnapshotMetric
            label="Employer Tax Rate"
            value={formatPercentage(assumptions.salaryTaxRate)}
            helper="Added on top of gross salary"
          />
          <SnapshotMetric
            label="Salary Growth"
            value={formatPercentage(assumptions.salaryGrowthRate) + " / yr"}
            helper="Annual salary increase"
          />
          <SnapshotMetric
            label="Commission / Bonus"
            value={formatPercentage(assumptions.commissionRate)}
            helper="Default variable compensation"
          />
          <SnapshotMetric
            label="Opex Inflation"
            value={formatPercentage(assumptions.inflationRate) + " / yr"}
            helper="Applied to non-salary costs"
          />
        </div>
      </div>
    </div>
  );
}

export function SnapshotMetric({
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
  setForm: Dispatch<SetStateAction<Omit<HeadcountRow, "id">>>;
  onAdd: () => void;
  onEdit: (row: HeadcountRow) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  editingId: string | null;
  summary: { count: number; totalBaseSalary: number };
  assumptions: GlobalAssumptions;
}

export function HeadcountSection({
  rows,
  form,
  setForm,
  onAdd,
  onEdit,
  onCancelEdit,
  onDelete,
  editingId,
  summary,
  assumptions,
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
            <h2 className="text-lg font-semibold text-slate-900">People Costs</h2>
            <p className="text-sm text-slate-500">
              Employees, contractors & advisors — salary, taxes, growth
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
                Type
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
                  colSpan={8}
                  className="px-6 py-8 text-center text-sm text-slate-500"
                >
                  No people added yet. Add your first hire below.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                    {row.role}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                      {PERSON_TYPE_LABELS[row.type]}
                    </span>
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
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {row.endMonth || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only">Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(row.id)}
                        className="inline-flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only">Delete</span>
                      </button>
                    </div>
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
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  type: e.target.value as PersonType,
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {PERSON_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PERSON_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
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
              {form.type === "employee" ? "Base Salary (€/mo)" : "Rate (€/mo)"}
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
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Start
            </label>
            <MonthPicker
              value={form.startMonth}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, startMonth: value }))
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              End (opt)
            </label>
            <MonthPicker
              value={form.endMonth || ""}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, endMonth: value || undefined }))
              }
              allowClear
              placeholder="Ongoing"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {editingId ? (
            <>
              <button
                type="button"
                onClick={onAdd}
                disabled={!form.role.trim() || form.baseSalary <= 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              disabled={!form.role.trim() || form.baseSalary <= 0}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 shrink-0" />
              Add
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Employer tax ({formatPercentage(assumptions.salaryTaxRate)}) applies to{" "}
          <span className="font-medium">employees only</span>; contractors and
          advisors are billed at their rate. Salaries grow{" "}
          {formatPercentage(assumptions.salaryGrowthRate)}/yr.
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
  setForm: Dispatch<
    SetStateAction<Omit<NonHeadcountExpenseRow, "id">>
  >;
  onAdd: () => void;
  onEdit: (row: NonHeadcountExpenseRow) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  editingId: string | null;
  summary: {
    count: number;
    recurringMonthly: number;
    oneTimeTotal: number;
  };
  assumptions: GlobalAssumptions;
  selectedIds: Set<string>;
  setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
  onBulkScale: (pct: number) => void;
  onBulkDelete: () => void;
  onBulkDuplicate: () => void;
}

export function NonHeadcountSection({
  rows,
  form,
  setForm,
  onAdd,
  onEdit,
  onCancelEdit,
  onDelete,
  editingId,
  summary,
  assumptions,
  selectedIds,
  setSelectedIds,
  onBulkScale,
  onBulkDelete,
  onBulkDuplicate,
}: NonHeadcountSectionProps) {
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const toggleAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  const toggleOne = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const formMethod = form.config?.method ?? "fixed";
  const canSubmitForm =
    form.name.trim().length > 0 &&
    (formMethod === "percentOfRevenue" ||
      formMethod === "perCustomer" ||
      formMethod === "perEmployee" ||
      form.amount > 0);
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
              Non-People Costs
            </h2>
            <p className="text-sm text-slate-500">
              Tools, infra, marketing & other costs — fixed, growing, or
              revenue-linked
            </p>
          </div>
        </div>
        {summary.count > 0 && (
          <div className="hidden sm:block text-right">
            <p className="text-xs text-slate-500">
              {summary.count} cost{summary.count !== 1 ? "s" : ""}
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {formatCurrency(summary.recurringMonthly)}/mo recurring
            </p>
            {summary.oneTimeTotal > 0 && (
              <p className="text-xs text-slate-500 mt-0.5 max-w-[240px] ml-auto leading-snug">
                +{formatCurrency(summary.oneTimeTotal)} one-time (start month
                only)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bulk toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-indigo-100 bg-indigo-50/60 px-6 py-3">
          <span className="text-sm font-medium text-indigo-900">
            {selectedIds.size} selected
          </span>
          <div className="h-4 w-px bg-indigo-200" />
          <button
            type="button"
            onClick={() => onBulkScale(10)}
            className="rounded-md border border-indigo-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
          >
            +10%
          </button>
          <button
            type="button"
            onClick={() => onBulkScale(-10)}
            className="rounded-md border border-indigo-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
          >
            −10%
          </button>
          <button
            type="button"
            onClick={() => {
              const input = window.prompt("Adjust selected costs by percent (e.g. 15 or -20):");
              if (input == null) return;
              const pct = parseFloat(input);
              if (Number.isFinite(pct)) onBulkScale(pct);
            }}
            className="rounded-md border border-indigo-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
          >
            Custom %…
          </button>
          <button
            type="button"
            onClick={onBulkDuplicate}
            className="rounded-md border border-indigo-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={onBulkDelete}
            className="rounded-md border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
          >
            Delete
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
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
                How it&apos;s calculated
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
                  colSpan={8}
                  className="px-6 py-8 text-center text-sm text-slate-500"
                >
                  No costs added yet. Add your first expense below.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const method = row.config?.method ?? "fixed";
                const linked = methodNeedsForecast(method);
                return (
                <tr
                  key={row.id}
                  className={
                    selectedIds.has(row.id)
                      ? "bg-indigo-50/40"
                      : "hover:bg-slate-50/60"
                  }
                >
                  <td className="px-4 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => toggleOne(row.id)}
                      aria-label={`Select ${row.name}`}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                    {row.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {EXPENSE_CATEGORY_SHORT_LABELS[row.category]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                    {linked ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <>
                        {formatCurrency(row.amount)}
                        {method === "fixed" && (
                          <span className="ml-1 text-xs text-slate-400">
                            {formatFrequency(row.frequency)}
                          </span>
                        )}
                      </>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        method === "fixed"
                          ? "bg-slate-100 text-slate-600"
                          : "bg-indigo-50 text-indigo-700"
                      }`}
                    >
                      {describeCostModel(row.config ?? null)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {row.startMonth}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {row.endMonth || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only">Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(row.id)}
                        className="inline-flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Form */}
      <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
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
              Cost type
            </label>
            <select
              value={form.config?.method ?? "fixed"}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  config: defaultModelForMethod(
                    e.target.value as CostMethod,
                    prev.config
                  ),
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {(Object.keys(COST_METHOD_LABELS) as CostMethod[]).map((m) => (
                <option key={m} value={m}>
                  {COST_METHOD_LABELS[m]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <CostMethodFields form={form} setForm={setForm} />

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Start
            </label>
            <MonthPicker
              value={form.startMonth}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, startMonth: value }))
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              End (opt)
            </label>
            <MonthPicker
              value={form.endMonth || ""}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, endMonth: value || undefined }))
              }
              allowClear
              placeholder="Ongoing"
            />
          </div>
        </div>

        <ScheduleEditor form={form} setForm={setForm} />

        <CostPreview form={form} assumptions={assumptions} />

        <div className="mt-4 flex flex-wrap gap-2">
          {editingId ? (
            <>
              <button
                type="button"
                onClick={onAdd}
                disabled={!canSubmitForm}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              disabled={!canSubmitForm}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 shrink-0" />
              Add
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Cost model editor helpers
// ============================================================================

export function defaultModelForMethod(
  method: CostMethod,
  prev?: CostModel | null
): CostModel {
  const shared = { steps: prev?.steps, overrides: prev?.overrides };
  switch (method) {
    case "growing":
      return {
        method: "growing",
        growthRate: 10,
        growthPeriod: "year",
        growthMode: "compound",
        ...shared,
      };
    case "percentOfRevenue":
      return { method: "percentOfRevenue", percent: 15, revenueBase: "total", ...shared };
    case "perCustomer":
      return {
        method: "perCustomer",
        amountPerUnit: 10,
        customerBasis: "active",
        stream: "total",
        ...shared,
      };
    case "perEmployee":
      return { method: "perEmployee", amountPerUnit: 100, employeeBasis: "fte", ...shared };
    case "fixed":
    default:
      return { method: "fixed", ...shared };
  }
}

export const fieldClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100";

export type NonPeopleForm = Omit<NonHeadcountExpenseRow, "id">;
export type SetNonPeopleForm = Dispatch<SetStateAction<NonPeopleForm>>;

export function CostMethodFields({
  form,
  setForm,
}: {
  form: NonPeopleForm;
  setForm: SetNonPeopleForm;
}) {
  const method: CostMethod = form.config?.method ?? "fixed";

  const patchConfig = (patch: Record<string, unknown>) =>
    setForm((prev) => ({
      ...prev,
      config: { ...(prev.config ?? { method: "fixed" }), ...patch } as CostModel,
    }));

  const labeled = (label: string, node: ReactNode) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      {node}
    </div>
  );

  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
      {method === "fixed" && (
        <>
          {labeled(
            "Amount (€)",
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
              className={fieldClass}
            />
          )}
          {labeled(
            "Frequency",
            <select
              value={form.frequency}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  frequency: e.target.value as NonHeadcountExpenseRow["frequency"],
                }))
              }
              className={fieldClass}
            >
              {EXPENSE_FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </>
      )}

      {method === "growing" && form.config?.method === "growing" && (
        <>
          {labeled(
            "Starting amount (€/mo)",
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
              className={fieldClass}
            />
          )}
          {labeled(
            "Growth rate (%)",
            <input
              type="number"
              step="1"
              value={form.config.growthRate}
              onChange={(e) =>
                patchConfig({ growthRate: parseFloat(e.target.value) || 0 })
              }
              className={fieldClass}
            />
          )}
          {labeled(
            "Per",
            <select
              value={form.config.growthPeriod}
              onChange={(e) => patchConfig({ growthPeriod: e.target.value })}
              className={fieldClass}
            >
              <option value="year">Year</option>
              <option value="month">Month</option>
            </select>
          )}
          {labeled(
            "Mode",
            <select
              value={form.config.growthMode}
              onChange={(e) => patchConfig({ growthMode: e.target.value })}
              className={fieldClass}
            >
              <option value="compound">Compounding</option>
              <option value="linear">Linear</option>
            </select>
          )}
        </>
      )}

      {method === "percentOfRevenue" && form.config?.method === "percentOfRevenue" && (
        <>
          {labeled(
            "Percent (%)",
            <input
              type="number"
              step="1"
              value={form.config.percent}
              onChange={(e) =>
                patchConfig({ percent: parseFloat(e.target.value) || 0 })
              }
              className={fieldClass}
            />
          )}
          {labeled(
            "Of",
            <select
              value={form.config.revenueBase}
              onChange={(e) => patchConfig({ revenueBase: e.target.value })}
              className={fieldClass}
            >
              {(Object.keys(REVENUE_BASE_LABELS) as RevenueBase[]).map((b) => (
                <option key={b} value={b}>
                  {REVENUE_BASE_LABELS[b]}
                </option>
              ))}
            </select>
          )}
        </>
      )}

      {method === "perCustomer" && form.config?.method === "perCustomer" && (
        <>
          {labeled(
            "€ per customer / mo",
            <input
              type="number"
              step="1"
              value={form.config.amountPerUnit}
              onChange={(e) =>
                patchConfig({ amountPerUnit: parseFloat(e.target.value) || 0 })
              }
              className={fieldClass}
            />
          )}
          {labeled(
            "Customers",
            <select
              value={form.config.customerBasis}
              onChange={(e) => patchConfig({ customerBasis: e.target.value })}
              className={fieldClass}
            >
              <option value="active">Active (all)</option>
              <option value="new">New this month</option>
            </select>
          )}
          {labeled(
            "Stream",
            <select
              value={form.config.stream ?? "total"}
              onChange={(e) => patchConfig({ stream: e.target.value })}
              className={fieldClass}
            >
              {(Object.keys(REVENUE_BASE_LABELS) as RevenueBase[]).map((b) => (
                <option key={b} value={b}>
                  {b === "total" ? "All customers" : REVENUE_BASE_LABELS[b]}
                </option>
              ))}
            </select>
          )}
        </>
      )}

      {method === "perEmployee" && form.config?.method === "perEmployee" && (
        <>
          {labeled(
            "€ per head / mo",
            <input
              type="number"
              step="1"
              value={form.config.amountPerUnit}
              onChange={(e) =>
                patchConfig({ amountPerUnit: parseFloat(e.target.value) || 0 })
              }
              className={fieldClass}
            />
          )}
          {labeled(
            "Basis",
            <select
              value={form.config.employeeBasis}
              onChange={(e) => patchConfig({ employeeBasis: e.target.value })}
              className={fieldClass}
            >
              <option value="fte">Per FTE</option>
              <option value="count">Per head</option>
            </select>
          )}
          {labeled(
            "Team",
            <select
              value={form.config.employeeCategory ?? ""}
              onChange={(e) =>
                patchConfig({ employeeCategory: e.target.value || undefined })
              }
              className={fieldClass}
            >
              <option value="">All people</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {EXPENSE_CATEGORY_SHORT_LABELS[cat]}
                </option>
              ))}
            </select>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// Advanced schedule: scheduled step changes + per-month overrides
// ============================================================================

export function ScheduleEditor({
  form,
  setForm,
}: {
  form: NonPeopleForm;
  setForm: SetNonPeopleForm;
}) {
  const [open, setOpen] = useState(false);
  const config = form.config;
  const steps = config?.steps ?? [];
  const overrides = config?.overrides ?? {};
  const stepCount = steps.length;
  const overrideCount = Object.keys(overrides).length;

  const setConfig = (patch: Partial<CostModel>) =>
    setForm((prev) => ({
      ...prev,
      config: { ...(prev.config ?? { method: "fixed" }), ...patch } as CostModel,
    }));

  const overrideMonths = buildMonthWindow(form.startMonth, 12);

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700"
      >
        <span className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
          Advanced schedule
        </span>
        {(stepCount > 0 || overrideCount > 0) && (
          <span className="text-xs text-indigo-600">
            {stepCount > 0 && `${stepCount} step${stepCount !== 1 ? "s" : ""}`}
            {stepCount > 0 && overrideCount > 0 && " · "}
            {overrideCount > 0 &&
              `${overrideCount} override${overrideCount !== 1 ? "s" : ""}`}
          </span>
        )}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-5">
          {/* Step changes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-700">
                Scheduled step changes
              </p>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    steps: [
                      ...steps,
                      { month: form.startMonth, amount: form.amount },
                    ],
                  })
                }
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="h-3.5 w-3.5" /> Add step
              </button>
            </div>
            {steps.length === 0 ? (
              <p className="text-xs text-slate-400">
                Set the base amount to a new value from a chosen month (e.g. rent
                increase).
              </p>
            ) : (
              <div className="space-y-2">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-40">
                      <MonthPicker
                        value={step.month}
                        onChange={(value) => {
                          const next = [...steps];
                          next[idx] = { ...next[idx], month: value };
                          setConfig({ steps: next });
                        }}
                      />
                    </div>
                    <input
                      type="number"
                      value={step.amount}
                      onChange={(e) => {
                        const next = [...steps];
                        next[idx] = {
                          ...next[idx],
                          amount: parseFloat(e.target.value) || 0,
                        };
                        setConfig({ steps: next });
                      }}
                      className={fieldClass + " max-w-[160px]"}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setConfig({ steps: steps.filter((_, i) => i !== idx) })
                      }
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Per-month overrides */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">
              Per-month overrides
            </p>
            <p className="text-xs text-slate-400 mb-2">
              Type a value to pin a specific month; leave blank to use the formula.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {overrideMonths.map((month) => (
                <div key={month}>
                  <label className="block text-[10px] text-slate-400 mb-0.5">
                    {month}
                  </label>
                  <input
                    type="number"
                    value={overrides[month] ?? ""}
                    placeholder="—"
                    onChange={(e) => {
                      const next = { ...overrides };
                      if (e.target.value === "") {
                        delete next[month];
                      } else {
                        next[month] = parseFloat(e.target.value) || 0;
                      }
                      setConfig({ overrides: next });
                    }}
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function buildMonthWindow(start: string, count: number): string[] {
  const months: string[] = [];
  for (let i = 0; i < count; i++) months.push(addMonthKey(start, i));
  return months;
}

// ============================================================================
// Live preview
// ============================================================================

export function CostPreview({
  form,
  assumptions,
}: {
  form: NonPeopleForm;
  assumptions: GlobalAssumptions;
}) {
  const method: CostMethod = form.config?.method ?? "fixed";

  if (methodNeedsForecast(method)) {
    return (
      <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-xs text-indigo-800">
        This cost updates automatically with your forecast (
        {describeCostModel(form.config ?? null)}). See it reflected on the
        Dashboard and Runway once saved.
      </div>
    );
  }

  const series = buildPreviewSeries(
    form,
    form.startMonth,
    12,
    assumptions.inflationRate
  );
  const months = buildMonthWindow(form.startMonth, 12);
  const max = Math.max(1, ...series);

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold text-slate-700 mb-2">
        Next 12 months preview
      </p>
      <div className="flex items-end gap-1 h-16">
        {series.map((value, i) => (
          <div
            key={i}
            className="flex-1 group relative flex flex-col justify-end"
            title={`${months[i]}: ${formatCurrency(value)}`}
          >
            <div
              className="w-full rounded-t bg-indigo-400/80 group-hover:bg-indigo-500 transition-colors"
              style={{ height: `${Math.max(2, (value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-slate-400">
        <span>{months[0]}</span>
        <span>{months[11]}</span>
      </div>
    </div>
  );
}
