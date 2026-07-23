"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  GitCompareArrows,
  Plus,
  Trash2,
  Copy,
  Loader2,
  ArrowRight,
  Pencil,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton, FormSectionSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { useActiveScenario } from "@/components/scenario/ActiveScenarioProvider";
import { ScenarioSelect } from "@/components/scenario/ScenarioSelect";
import { formatCompactCurrency, setActiveCurrency } from "@/lib/currency";
import type { ForecastResult, ForecastMonth } from "@/lib/revenueForecast";

interface Scenario {
  id: string;
  name: string;
  config: unknown;
  createdAt: string;
}

interface ScenarioForecast {
  scenarioId: string;
  scenarioName: string;
  months: ForecastMonth[];
  summary: ForecastResult["summary"];
}

const COLORS = ["#7ecfc7", "#10b981", "#f59e0b", "#ef4444", "#5bb5aa"];

function formatCompact(value: number): string {
  return formatCompactCurrency(value);
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

type CreateMode = "fresh" | "copy";

export default function ScenariosPage() {
  const { setScenarioId, refreshScenarios } = useActiveScenario();
  const [planId, setPlanId] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [forecasts, setForecasts] = useState<ScenarioForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [createMode, setCreateMode] = useState<CreateMode>("fresh");
  const [sourceScenarioId, setSourceScenarioId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Scenario | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadScenarios = useCallback(async () => {
    try {
      setLoading(true);
      const planRes = await fetch("/api/plans/current");
      const planData = await planRes.json();
      if (!planData.success) throw new Error(planData.error);
      setPlanId(planData.data.id);
      setActiveCurrency(planData.data.currency);

      const scenRes = await fetch(
        `/api/scenarios?planId=${encodeURIComponent(planData.data.id)}`
      );
      const scenData = await scenRes.json();
      if (!scenData.success) throw new Error(scenData.error);
      setScenarios(scenData.data);

      if (scenData.data.length > 0) {
        setSelectedIds(scenData.data.map((s: Scenario) => s.id));
        setSourceScenarioId((prev) => {
          if (prev && scenData.data.some((s: Scenario) => s.id === prev)) {
            return prev;
          }
          const def = scenData.data.find((s: Scenario) => s.name === "Default");
          return def?.id ?? scenData.data[0].id;
        });
      }
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to load scenarios",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  const runComparison = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setComparing(true);
    try {
      const results = await Promise.all(
        selectedIds.map(async (id) => {
          const res = await fetch(`/api/scenarios/${id}/forecast`);
          const data = await res.json();
          if (!data.success) throw new Error(data.error);
          return data.data as ScenarioForecast;
        })
      );
      setForecasts(results);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to run comparison",
        "error"
      );
    } finally {
      setComparing(false);
    }
  }, [selectedIds, toast]);

  useEffect(() => {
    if (selectedIds.length > 0 && !loading) {
      runComparison();
    }
  }, [selectedIds, loading, runComparison]);

  const handleCreate = async () => {
    if (!planId || !newName.trim() || creating) return;
    if (createMode === "copy" && !sourceScenarioId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          name: newName.trim(),
          mode: createMode,
          ...(createMode === "copy" ? { sourceScenarioId } : {}),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast(`Scenario "${newName.trim()}" created`);
      setNewName("");
      setScenarioId(data.data.id);
      await refreshScenarios();
      await loadScenarios();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to create scenario",
        "error"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDuplicate = async (scenario: Scenario) => {
    if (!planId) return;
    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          name: `${scenario.name} (copy)`,
          mode: "copy",
          sourceScenarioId: scenario.id,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast(`Duplicated "${scenario.name}"`);
      setScenarioId(data.data.id);
      await refreshScenarios();
      await loadScenarios();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to duplicate",
        "error"
      );
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/scenarios/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast("Scenario deleted");
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
      setDeleteTarget(null);
      await refreshScenarios();
      await loadScenarios();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to delete",
        "error"
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  const startEditing = (scenario: Scenario) => {
    setEditingId(scenario.id);
    setEditName(scenario.name);
    setTimeout(() => editInputRef.current?.select(), 0);
  };

  const handleRename = async (id: string) => {
    const original = scenarios.find((s) => s.id === id);
    if (!editName.trim() || editName.trim() === original?.name) {
      setEditingId(null);
      return;
    }
    try {
      const res = await fetch(`/api/scenarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast(`Renamed to "${editName.trim()}"`);
      setEditingId(null);
      await refreshScenarios();
      await loadScenarios();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to rename scenario",
        "error"
      );
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const createDisabled =
    !newName.trim() ||
    creating ||
    (createMode === "copy" && !sourceScenarioId);

  const arrChartData =
    forecasts.length > 0
      ? forecasts[0].months
          .filter(
            (_, i) =>
              i %
                (forecasts[0].months.length > 24
                  ? Math.ceil(forecasts[0].months.length / 24)
                  : 1) ===
                0 || i === forecasts[0].months.length - 1
          )
          .map((m, idx) => {
            const point: { date: string; [key: string]: string | number } = {
              date: m.date,
            };
            forecasts.forEach((f) => {
              const fMonth =
                f.months.find((fm) => fm.date === m.date) ?? f.months[idx];
              if (fMonth) point[f.scenarioName] = Math.round(fMonth.totalArr);
            });
            return point;
          })
      : [];

  const arrSeries = forecasts.map((f, i) => ({
    dataKey: f.scenarioName,
    name: f.scenarioName,
    color: COLORS[i % COLORS.length],
  }));

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <FormSectionSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="space-y-8">
          <PageHeader
            title="Scenarios"
            subtitle="Compare independent forecasts side by side. Switch the active scenario in the header to edit one."
            actions={
              <Link
                href="/app/revenue"
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50"
              >
                Edit revenue
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />

          <p className="text-sm text-neutral-600 -mt-4">
            Each scenario has its own revenue, assumptions, and expenses. Plan
            currency and forecast length are shared.
          </p>

          {/* Create scenario */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Your scenarios
            </h2>
            <div className="mb-6 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="New scenario name (e.g. Aggressive growth)"
                  className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 shadow-sm focus:border-turquoise-300 focus:outline-none focus:ring-2 focus:ring-turquoise-100"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
                <button
                  onClick={handleCreate}
                  disabled={createDisabled}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex rounded-xl border border-neutral-200 p-1 bg-neutral-50">
                  <button
                    type="button"
                    onClick={() => setCreateMode("fresh")}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      createMode === "fresh"
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-700"
                    }`}
                  >
                    Start fresh
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateMode("copy")}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      createMode === "copy"
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-700"
                    }`}
                  >
                    Copy from…
                  </button>
                </div>
                {createMode === "copy" && (
                  <ScenarioSelect
                    options={scenarios}
                    value={sourceScenarioId}
                    onChange={setSourceScenarioId}
                    label="Copy from scenario"
                    menuLabel="Copy from"
                    placeholder="Choose scenario"
                  />
                )}
                {createMode === "fresh" && (
                  <p className="text-xs text-neutral-500">
                    Starter revenue and assumptions, no people or expenses.
                  </p>
                )}
                {createMode === "copy" && (
                  <p className="text-xs text-neutral-500">
                    Clones revenue, assumptions, people, and expenses.
                  </p>
                )}
              </div>
            </div>

            {scenarios.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-6">
                No scenarios yet. Create one to start comparing forecasts.
              </p>
            ) : (
              <div className="space-y-2">
                {scenarios.map((s, i) => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition ${
                      selectedIds.includes(s.id)
                        ? "border-turquoise-200 bg-turquoise-50/50"
                        : "border-neutral-200 bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      className="h-4 w-4 rounded border-neutral-300 text-turquoise-600 focus:ring-turquoise-400"
                    />
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      {editingId === s.id ? (
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(s.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          onBlur={() => handleRename(s.id)}
                          className="w-full rounded-lg border border-turquoise-300 px-2 py-1 text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-turquoise-100"
                          autoFocus
                        />
                      ) : (
                        <p
                          className="text-sm font-medium text-neutral-900 truncate cursor-pointer"
                          onDoubleClick={() => startEditing(s)}
                        >
                          {s.name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingId !== s.id && (
                        <button
                          onClick={() => startEditing(s)}
                          className="p-1.5 text-neutral-400 hover:text-turquoise-600 transition"
                          title="Rename"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicate(s)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-600 transition"
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      {s.name !== "Default" && (
                        <button
                          onClick={() => setDeleteTarget(s)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comparison results */}
          {comparing && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-turquoise-600 mr-2" />
              <span className="text-sm text-neutral-600">
                Running forecast comparison...
              </span>
            </div>
          )}

          {forecasts.length >= 2 && !comparing && (
            <>
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-turquoise-100">
                    <GitCompareArrows className="h-4 w-4 text-turquoise-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Comparison
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                          Metric
                        </th>
                        {forecasts.map((f, i) => (
                          <th
                            key={f.scenarioId}
                            className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider"
                            style={{ color: COLORS[i % COLORS.length] }}
                          >
                            {f.scenarioName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      <ComparisonRow
                        label="Projected ARR"
                        values={forecasts.map((f) =>
                          formatCompact(f.summary.projectedArr)
                        )}
                      />
                      <ComparisonRow
                        label="Projected MRR"
                        values={forecasts.map((f) =>
                          formatCompact(f.summary.projectedMrr)
                        )}
                      />
                      <ComparisonRow
                        label="Net New ARR"
                        values={forecasts.map((f) =>
                          formatCompact(f.summary.netNewArr)
                        )}
                      />
                      <ComparisonRow
                        label="Total Customers"
                        values={forecasts.map((f) =>
                          f.summary.totalCustomers.toString()
                        )}
                      />
                      <ComparisonRow
                        label="NRR"
                        values={forecasts.map((f) =>
                          formatPct(f.summary.annualNrr)
                        )}
                      />
                      <ComparisonRow
                        label="Burn Multiple"
                        values={forecasts.map(
                          (f) => `${f.summary.burnMultiple.toFixed(1)}x`
                        )}
                      />
                      <ComparisonRow
                        label="Rule of 40"
                        values={forecasts.map((f) =>
                          formatPct(f.summary.ruleOf40)
                        )}
                      />
                      <ComparisonRow
                        label="Monthly Burn"
                        values={forecasts.map((f) =>
                          formatCompact(f.summary.monthlyBurn)
                        )}
                      />
                    </tbody>
                  </table>
                </div>
              </div>

              <ChartCard
                title="ARR Comparison"
                description="Projected ARR across scenarios over the forecast period."
                data={arrChartData}
                series={arrSeries}
              />
            </>
          )}

          {forecasts.length === 1 && !comparing && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
              <GitCompareArrows className="mx-auto h-10 w-10 text-neutral-300" />
              <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                Select at least 2 scenarios to compare
              </h3>
              <p className="mt-2 text-sm text-neutral-500">
                Check multiple scenarios above to see a side-by-side comparison.
              </p>
            </div>
          )}

          <ConfirmDialog
            open={deleteTarget !== null}
            title="Delete scenario?"
            description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
            confirmPending={deleteBusy}
            confirmPendingLabel="Deleting…"
            onConfirm={() => {
              if (deleteTarget) handleDelete(deleteTarget.id);
            }}
            onCancel={() => {
              if (!deleteBusy) setDeleteTarget(null);
            }}
          />
        </div>
      </div>
    </main>
  );
}

function ComparisonRow({
  label,
  values,
}: {
  label: string;
  values: string[];
}) {
  return (
    <tr className="hover:bg-neutral-50/60">
      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-neutral-900">
        {label}
      </td>
      {values.map((v, i) => (
        <td
          key={i}
          className="whitespace-nowrap px-4 py-3 text-sm text-right font-semibold tabular-nums text-neutral-700"
        >
          {v}
        </td>
      ))}
    </tr>
  );
}
