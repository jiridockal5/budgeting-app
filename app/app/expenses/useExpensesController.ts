"use client";

import { useEffect, useMemo, useState } from "react";
import type { Expense, Person } from "@prisma/client";
import {
  DEFAULT_ASSUMPTIONS,
  type GlobalAssumptions,
  normalizeAssumptions,
} from "@/lib/assumptions";
import {
  type CostModel,
  type ExpenseCategory,
  type HeadcountRow,
  type NonHeadcountExpenseRow,
  parseCostModel,
  type PersonType,
} from "@/lib/expenses";
import { useToast } from "@/components/ui/Toast";
import { fetchJsonEnvelope } from "@/lib/clientFetch";

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function isoToMonth(iso: string | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function mapDbFrequency(
  freq: string
): NonHeadcountExpenseRow["frequency"] {
  switch (freq) {
    case "MONTHLY":
      return "monthly";
    case "YEARLY":
      return "annual";
    case "ONE_TIME":
      return "one_time";
    default: {
      console.warn("Unknown expense frequency from API:", freq);
      return "monthly";
    }
  }
}

function mapUiFrequency(freq: NonHeadcountExpenseRow["frequency"]): string {
  switch (freq) {
    case "monthly":
      return "MONTHLY";
    case "annual":
      return "YEARLY";
    case "one_time":
      return "ONE_TIME";
  }
}

function mapPersonToRow(person: Person): HeadcountRow {
  return {
    id: person.id,
    role: person.role,
    type: (person.type as PersonType) ?? "employee",
    category: person.category as ExpenseCategory,
    baseSalary: person.salary,
    fte: person.fte,
    startMonth: person.startDate
      ? isoToMonth(person.startDate)
      : getCurrentMonth(),
    endMonth: person.endDate ? isoToMonth(person.endDate) : undefined,
  };
}

function mapExpenseToRow(expense: Expense): NonHeadcountExpenseRow {
  return {
    id: expense.id,
    name: expense.name,
    category: expense.category as ExpenseCategory,
    amount: Number(expense.amount),
    frequency: mapDbFrequency(expense.frequency),
    startMonth: isoToMonth(expense.startMonth),
    endMonth: expense.endMonth ? isoToMonth(expense.endMonth) : undefined,
    config: parseCostModel(expense.config),
  };
}

/**
 * A plain fixed cost with no schedule overrides needs no stored config, so we
 * send null to preserve the legacy fast path. Anything richer is persisted.
 */
function serializeConfig(config: CostModel | null | undefined): CostModel | null {
  if (!config) return null;
  const hasSchedule =
    (config.steps && config.steps.length > 0) ||
    (config.overrides && Object.keys(config.overrides).length > 0);
  if (config.method === "fixed" && !hasSchedule) return null;
  return config;
}

/**
 * Scale a row's primary numeric driver by a factor, for bulk % adjustments.
 * Targets whichever value drives the line's cost for its method.
 */
function scaleRowPrimary(
  row: NonHeadcountExpenseRow,
  factor: number
): NonHeadcountExpenseRow {
  const round = (n: number) => Math.round(n * 100) / 100;
  const config = row.config;
  if (config) {
    if (config.method === "percentOfRevenue") {
      return { ...row, config: { ...config, percent: round(config.percent * factor) } };
    }
    if (config.method === "perCustomer" || config.method === "perEmployee") {
      return {
        ...row,
        config: { ...config, amountPerUnit: round(config.amountPerUnit * factor) },
      };
    }
  }
  return { ...row, amount: round(row.amount * factor) };
}

function nonHeadcountNeedsBaseAmount(
  row: Omit<NonHeadcountExpenseRow, "id">
): boolean {
  const method = row.config?.method ?? "fixed";
  return method === "fixed" || method === "growing";
}

export function useExpensesController() {
  // ── Plan & loading state ──
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadWarnings, setLoadWarnings] = useState<string | null>(null);
  const [assumptions, setAssumptions] =
    useState<GlobalAssumptions>(DEFAULT_ASSUMPTIONS);

  // ── Headcount state ──
  const [headcountRows, setHeadcountRows] = useState<HeadcountRow[]>([]);
  const [headcountForm, setHeadcountForm] = useState<Omit<HeadcountRow, "id">>({
    role: "",
    type: "employee",
    category: "rnd",
    baseSalary: 0,
    fte: 1.0,
    startMonth: getCurrentMonth(),
    endMonth: undefined,
  });
  const [editingHeadcountId, setEditingHeadcountId] = useState<string | null>(
    null
  );

  // ── Non-headcount state ──
  const [nonHeadcountRows, setNonHeadcountRows] = useState<
    NonHeadcountExpenseRow[]
  >([]);
  const [nonHeadcountForm, setNonHeadcountForm] = useState<
    Omit<NonHeadcountExpenseRow, "id">
  >({
    name: "",
    category: "ops",
    amount: 0,
    frequency: "monthly",
    startMonth: getCurrentMonth(),
    endMonth: undefined,
    config: null,
  });
  const [editingNonHeadcountId, setEditingNonHeadcountId] = useState<
    string | null
  >(null);
  const [selectedNonPeople, setSelectedNonPeople] = useState<Set<string>>(
    new Set()
  );

  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "headcount" | "expense";
    id: string;
    name: string;
  } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // ── Load plan + data on mount ──
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        setLoadWarnings(null);

        const planResult = await fetchJsonEnvelope<{ id: string }>(
          "/api/plans/current"
        );
        if (!planResult.ok) throw new Error(planResult.error);

        const id = planResult.data.id;
        setPlanId(id);

        const [peopleRes, expensesRes, assumptionsRes] = await Promise.all([
          fetchJsonEnvelope<Person[]>(
            `/api/people?planId=${encodeURIComponent(id)}`
          ),
          fetchJsonEnvelope<Expense[]>(
            `/api/expenses?planId=${encodeURIComponent(id)}`
          ),
          fetchJsonEnvelope<Partial<GlobalAssumptions>>(
            `/api/assumptions?planId=${encodeURIComponent(id)}`
          ),
        ]);

        const warnings: string[] = [];

        if (peopleRes.ok) {
          setHeadcountRows(peopleRes.data.map(mapPersonToRow));
        } else {
          setHeadcountRows([]);
          warnings.push(peopleRes.error);
        }

        if (expensesRes.ok) {
          setNonHeadcountRows(expensesRes.data.map(mapExpenseToRow));
        } else {
          setNonHeadcountRows([]);
          warnings.push(expensesRes.error);
        }

        if (assumptionsRes.ok) {
          setAssumptions(normalizeAssumptions(assumptionsRes.data));
        } else {
          warnings.push(assumptionsRes.error);
        }

        if (warnings.length > 0) {
          setLoadWarnings(warnings.join(" · "));
        }
      } catch (err) {
        console.error("Failed to load expenses data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // ── Headcount handlers ──

  const handleAddHeadcount = async () => {
    if (!headcountForm.role.trim() || headcountForm.baseSalary <= 0 || !planId)
      return;

    try {
      if (editingHeadcountId) {
        const res = await fetch(`/api/people/${editingHeadcountId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId,
            name: headcountForm.role,
            role: headcountForm.role,
            type: headcountForm.type,
            salary: headcountForm.baseSalary,
            category: headcountForm.category,
            fte: headcountForm.fte,
            startDate: headcountForm.startMonth + "-01",
            endDate: headcountForm.endMonth ? headcountForm.endMonth + "-01" : null,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to update");
        setHeadcountRows((prev) =>
          prev.map((r) =>
            r.id === editingHeadcountId ? mapPersonToRow(data.data) : r
          )
        );
        setEditingHeadcountId(null);
        toast("Role updated successfully");
      } else {
        const res = await fetch("/api/people", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId,
            name: headcountForm.role,
            role: headcountForm.role,
            type: headcountForm.type,
            salary: headcountForm.baseSalary,
            category: headcountForm.category,
            fte: headcountForm.fte,
            startDate: headcountForm.startMonth + "-01",
            endDate: headcountForm.endMonth ? headcountForm.endMonth + "-01" : null,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to create");
        setHeadcountRows((prev) => [...prev, mapPersonToRow(data.data)]);
        toast("Role added successfully");
      }

      setHeadcountForm({
        role: "",
        type: "employee",
        category: "rnd",
        baseSalary: 0,
        fte: 1.0,
        startMonth: getCurrentMonth(),
        endMonth: undefined,
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save headcount", "error");
    }
  };

  const handleEditHeadcount = (row: HeadcountRow) => {
    setEditingHeadcountId(row.id);
    setHeadcountForm({
      role: row.role,
      type: row.type,
      category: row.category,
      baseSalary: row.baseSalary,
      fte: row.fte,
      startMonth: row.startMonth,
      endMonth: row.endMonth,
    });
  };

  const handleCancelEditHeadcount = () => {
    setEditingHeadcountId(null);
    setHeadcountForm({
      role: "",
      type: "employee",
      category: "rnd",
      baseSalary: 0,
      fte: 1.0,
      startMonth: getCurrentMonth(),
      endMonth: undefined,
    });
  };

  const handleDeleteHeadcount = async (id: string): Promise<boolean> => {
    if (!planId) return false;
    try {
      const res = await fetch(`/api/people/${id}?planId=${planId}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { success: boolean; error?: string };
      if (!res.ok || !data.success) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to delete"
        );
      }
      setHeadcountRows((prev) => prev.filter((row) => row.id !== id));
      if (editingHeadcountId === id) handleCancelEditHeadcount();
      toast("Role deleted");
      return true;
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to delete headcount",
        "error"
      );
      return false;
    }
  };

  // ── Non-headcount handlers ──

  const handleAddNonHeadcount = async () => {
    if (!nonHeadcountForm.name.trim() || !planId) return;
    if (
      nonHeadcountNeedsBaseAmount(nonHeadcountForm) &&
      nonHeadcountForm.amount <= 0
    ) {
      return;
    }

    try {
      if (editingNonHeadcountId) {
        const res = await fetch(`/api/expenses/${editingNonHeadcountId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId,
            name: nonHeadcountForm.name,
            category: nonHeadcountForm.category,
            amount: nonHeadcountForm.amount,
            frequency: mapUiFrequency(nonHeadcountForm.frequency),
            startMonth: nonHeadcountForm.startMonth,
            endMonth: nonHeadcountForm.endMonth || null,
            config: serializeConfig(nonHeadcountForm.config),
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to update");
        setNonHeadcountRows((prev) =>
          prev.map((r) =>
            r.id === editingNonHeadcountId ? mapExpenseToRow(data.data) : r
          )
        );
        setEditingNonHeadcountId(null);
        toast("Expense updated successfully");
      } else {
        const res = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId,
            name: nonHeadcountForm.name,
            category: nonHeadcountForm.category,
            amount: nonHeadcountForm.amount,
            frequency: mapUiFrequency(nonHeadcountForm.frequency),
            startMonth: nonHeadcountForm.startMonth,
            endMonth: nonHeadcountForm.endMonth || null,
            config: serializeConfig(nonHeadcountForm.config),
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to create");
        setNonHeadcountRows((prev) => [...prev, mapExpenseToRow(data.data)]);
        toast("Expense added successfully");
      }

      setNonHeadcountForm({
        name: "",
        category: "ops",
        amount: 0,
        frequency: "monthly",
        startMonth: getCurrentMonth(),
        endMonth: undefined,
        config: null,
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save expense", "error");
    }
  };

  const handleEditNonHeadcount = (row: NonHeadcountExpenseRow) => {
    setEditingNonHeadcountId(row.id);
    setNonHeadcountForm({
      name: row.name,
      category: row.category,
      amount: row.amount,
      frequency: row.frequency,
      startMonth: row.startMonth,
      endMonth: row.endMonth,
      config: row.config ?? null,
    });
  };

  const handleCancelEditNonHeadcount = () => {
    setEditingNonHeadcountId(null);
    setNonHeadcountForm({
      name: "",
      category: "ops",
      amount: 0,
      frequency: "monthly",
      startMonth: getCurrentMonth(),
      endMonth: undefined,
      config: null,
    });
  };

  const handleDeleteNonHeadcount = async (id: string): Promise<boolean> => {
    if (!planId) return false;
    try {
      const res = await fetch(`/api/expenses/${id}?planId=${planId}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { success: boolean; error?: string };
      if (!res.ok || !data.success) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to delete"
        );
      }
      setNonHeadcountRows((prev) => prev.filter((row) => row.id !== id));
      setSelectedNonPeople((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (editingNonHeadcountId === id) handleCancelEditNonHeadcount();
      toast("Expense deleted");
      return true;
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to delete expense",
        "error"
      );
      return false;
    }
  };

  // ── Bulk operations on non-people costs ──

  const persistNonPeopleRow = async (
    row: NonHeadcountExpenseRow
  ): Promise<NonHeadcountExpenseRow | null> => {
    if (!planId) return null;
    const res = await fetch(`/api/expenses/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId,
        name: row.name,
        category: row.category,
        amount: row.amount,
        frequency: mapUiFrequency(row.frequency),
        startMonth: row.startMonth,
        endMonth: row.endMonth || null,
        config: serializeConfig(row.config),
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to update");
    return mapExpenseToRow(data.data);
  };

  const handleBulkScale = async (pct: number) => {
    const factor = 1 + pct / 100;
    const targets = nonHeadcountRows.filter((r) => selectedNonPeople.has(r.id));
    if (targets.length === 0) return;
    try {
      const updates = await Promise.all(
        targets.map((row) => persistNonPeopleRow(scaleRowPrimary(row, factor)))
      );
      const byId = new Map(updates.filter(Boolean).map((u) => [u!.id, u!]));
      setNonHeadcountRows((prev) =>
        prev.map((r) => byId.get(r.id) ?? r)
      );
      toast(
        `${targets.length} cost${targets.length !== 1 ? "s" : ""} adjusted by ${pct > 0 ? "+" : ""}${pct}%`
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : "Bulk update failed", "error");
    }
  };

  const handleBulkDeleteNonPeople = async () => {
    const ids = [...selectedNonPeople];
    if (ids.length === 0) return;
    let ok = 0;
    for (const id of ids) {
      if (await handleDeleteNonHeadcount(id)) ok += 1;
    }
    setSelectedNonPeople(new Set());
    if (ok > 0) toast(`${ok} cost${ok !== 1 ? "s" : ""} deleted`);
  };

  const handleDuplicateNonPeople = async () => {
    if (!planId) return;
    const targets = nonHeadcountRows.filter((r) => selectedNonPeople.has(r.id));
    if (targets.length === 0) return;
    try {
      const created: NonHeadcountExpenseRow[] = [];
      for (const row of targets) {
        const res = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId,
            name: `${row.name} (copy)`,
            category: row.category,
            amount: row.amount,
            frequency: mapUiFrequency(row.frequency),
            startMonth: row.startMonth,
            endMonth: row.endMonth || null,
            config: serializeConfig(row.config),
          }),
        });
        const data = await res.json();
        if (data.success) created.push(mapExpenseToRow(data.data));
      }
      setNonHeadcountRows((prev) => [...prev, ...created]);
      setSelectedNonPeople(new Set());
      toast(`${created.length} cost${created.length !== 1 ? "s" : ""} duplicated`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Duplicate failed", "error");
    }
  };

  // ── Summary calculations ──

  const headcountSummary = useMemo(() => {
    const totalBaseSalary = headcountRows.reduce(
      (sum, row) => sum + row.baseSalary * row.fte,
      0
    );
    return { count: headcountRows.length, totalBaseSalary };
  }, [headcountRows]);

  const nonHeadcountSummary = useMemo(() => {
    let recurringMonthly = 0;
    let oneTimeTotal = 0;
    for (const row of nonHeadcountRows) {
      if (row.frequency === "annual") recurringMonthly += row.amount / 12;
      else if (row.frequency === "one_time") oneTimeTotal += row.amount;
      else recurringMonthly += row.amount;
    }
    return {
      count: nonHeadcountRows.length,
      recurringMonthly,
      oneTimeTotal,
    };
  }, [nonHeadcountRows]);

  const requestDeleteHeadcount = (id: string) => {
    const row = headcountRows.find((r) => r.id === id);
    setDeleteTarget({ type: "headcount", id, name: row?.role ?? "this role" });
  };

  const requestDeleteNonHeadcount = (id: string) => {
    const row = nonHeadcountRows.find((r) => r.id === id);
    setDeleteTarget({ type: "expense", id, name: row?.name ?? "this expense" });
  };

  const confirmDeleteTarget = async () => {
    if (!deleteTarget || deleteBusy) return;
    setDeleteBusy(true);
    try {
      const ok =
        deleteTarget.type === "headcount"
          ? await handleDeleteHeadcount(deleteTarget.id)
          : await handleDeleteNonHeadcount(deleteTarget.id);
      if (ok) setDeleteTarget(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const cancelDeleteTarget = () => {
    if (!deleteBusy) setDeleteTarget(null);
  };

  return {
    planId,
    setPlanId,
    loading,
    setLoading,
    error,
    setError,
    loadWarnings,
    setLoadWarnings,
    assumptions,
    setAssumptions,
    headcountRows,
    setHeadcountRows,
    headcountForm,
    setHeadcountForm,
    editingHeadcountId,
    setEditingHeadcountId,
    nonHeadcountRows,
    setNonHeadcountRows,
    nonHeadcountForm,
    setNonHeadcountForm,
    editingNonHeadcountId,
    setEditingNonHeadcountId,
    selectedNonPeople,
    setSelectedNonPeople,
    toast,
    deleteTarget,
    setDeleteTarget,
    deleteBusy,
    setDeleteBusy,
    handleAddHeadcount,
    handleEditHeadcount,
    handleCancelEditHeadcount,
    handleDeleteHeadcount,
    handleAddNonHeadcount,
    handleEditNonHeadcount,
    handleCancelEditNonHeadcount,
    handleDeleteNonHeadcount,
    persistNonPeopleRow,
    handleBulkScale,
    handleBulkDeleteNonPeople,
    handleDuplicateNonPeople,
    headcountSummary,
    nonHeadcountSummary,
    requestDeleteHeadcount,
    requestDeleteNonHeadcount,
    confirmDeleteTarget,
    cancelDeleteTarget,
  };
}
