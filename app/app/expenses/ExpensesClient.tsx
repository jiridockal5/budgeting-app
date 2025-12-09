"use client";

import { useMemo, useState } from "react";
import { ExpenseFrequency } from "@prisma/client";
import { ExpenseView, PlanSummary } from "./types";

type ExpenseFormState = {
  name: string;
  category: string;
  amount: string;
  frequency: ExpenseFrequency;
  startMonth: string;
  endMonth: string;
};

type Props = {
  plan: PlanSummary;
  initialExpenses: ExpenseView[];
};

const FREQUENCY_OPTIONS: { label: string; value: ExpenseFrequency }[] = [
  { label: "Monthly", value: ExpenseFrequency.MONTHLY },
  { label: "One-time", value: ExpenseFrequency.ONE_TIME },
  { label: "Yearly", value: ExpenseFrequency.YEARLY },
];

function monthInputValue(dateIso?: string | null) {
  if (!dateIso) return "";
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 7);
}

function formatMonth(dateIso?: string | null) {
  if (!dateIso) return "—";
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

function formatCurrency(currency: string, value: number) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function sortExpenses(expenses: ExpenseView[]) {
  return [...expenses].sort(
    (a, b) =>
      new Date(a.startMonth).getTime() - new Date(b.startMonth).getTime()
  );
}

const createEmptyForm = (startMonth?: string): ExpenseFormState => ({
  name: "",
  category: "",
  amount: "",
  frequency: ExpenseFrequency.MONTHLY,
  startMonth: startMonth ?? monthInputValue(new Date().toISOString()),
  endMonth: "",
});

export default function ExpensesClient({ plan, initialExpenses }: Props) {
  const [expenses, setExpenses] = useState<ExpenseView[]>(
    sortExpenses(initialExpenses)
  );
  const [form, setForm] = useState<ExpenseFormState>(
    createEmptyForm(plan.startMonth)
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tableEmpty = useMemo(() => expenses.length === 0, [expenses]);

  const handleInputChange = (
    field: keyof ExpenseFormState,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(createEmptyForm(plan.startMonth));
  };

  const handleEdit = (expense: ExpenseView) => {
    setEditingId(expense.id);
    setForm({
      name: expense.name,
      category: expense.category,
      amount: expense.amount.toString(),
      frequency: expense.frequency,
      startMonth: monthInputValue(expense.startMonth),
      endMonth: monthInputValue(expense.endMonth),
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      planId: plan.id,
      name: form.name.trim(),
      category: form.category.trim(),
      amount: form.amount,
      frequency: form.frequency,
      startMonth: form.startMonth ? `${form.startMonth}-01` : "",
      endMonth: form.endMonth ? `${form.endMonth}-01` : null,
    };

    try {
      const endpoint = editingId
        ? `/api/expenses/${editingId}`
        : "/api/expenses";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      const saved: ExpenseView = data.data;

      setExpenses((prev) => {
        const filtered = editingId
          ? prev.filter((item) => item.id !== editingId)
          : prev;
        return sortExpenses([...filtered, saved]);
      });
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save expense. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (expense: ExpenseView) => {
    if (!window.confirm(`Delete expense "${expense.name}"?`)) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/expenses/${expense.id}?planId=${encodeURIComponent(
          expense.planId
        )}`,
        { method: "DELETE" }
      );
      const data = await response.json();

      if (!data.success) {
        setError(data.error ?? "Could not delete expense");
        return;
      }

      setExpenses((prev) => prev.filter((item) => item.id !== expense.id));
      if (editingId === expense.id) {
        resetForm();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete expense."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Expenses for {plan.name}
            </h2>
            <p className="text-sm text-slate-600">
              Manage recurring and one-time costs tied to this plan.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {expenses.length} total
          </span>
        </div>

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
              {tableEmpty ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    No expenses yet. Add your first expense using the form on the
                    right.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {expense.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {expense.category}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                      {formatCurrency(plan.currency, expense.amount)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {expense.frequency.replace("_", " ")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatMonth(expense.startMonth)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatMonth(expense.endMonth)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(expense)}
                          className="text-indigo-600 hover:text-indigo-500"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(expense)}
                          className="text-rose-600 hover:text-rose-500"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {editingId ? "Edit expense" : "Add expense"}
            </h3>
            <p className="text-sm text-slate-600">
              Capture the key details for this cost item.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
            >
              Cancel edit
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-800">Name</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="AWS, HubSpot, Contractors…"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-800">
              Category
            </label>
            <input
              required
              type="text"
              value={form.category}
              onChange={(e) => handleInputChange("category", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="Software, People, Marketing…"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">
                Amount
              </label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">
                Frequency
              </label>
              <select
                value={form.frequency}
                onChange={(e) =>
                  handleInputChange(
                    "frequency",
                    e.target.value as ExpenseFrequency
                  )
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                {FREQUENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">
                Start month
              </label>
              <input
                required
                type="month"
                value={form.startMonth}
                onChange={(e) => handleInputChange("startMonth", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">
                End month (optional)
              </label>
              <input
                type="month"
                value={form.endMonth}
                onChange={(e) => handleInputChange("endMonth", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {editingId ? "Update expense" : "Add expense"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="text-sm font-medium text-slate-700 hover:text-slate-900 disabled:opacity-60"
            >
              Clear
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

