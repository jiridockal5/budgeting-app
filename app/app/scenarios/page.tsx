"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  GitCompareArrows,
  Plus,
  Trash2,
  Copy,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton, FormSectionSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { formatCurrency } from "@/lib/assumptions";
import type { ForecastResult, ForecastMonth } from "@/lib/revenueForecast";
import { DEFAULT_REVENUE_CONFIG } from "@/lib/revenueForecast";

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

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000)
    return `€${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `€${Math.round(value / 1_000)}K`;
  return formatCurrency(Math.round(value));
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export default function ScenariosPage() {
  const [planId, setPlanId] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [forecasts, setForecasts] = useState<ScenarioForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Scenario | null>(null);
  const { toast } = useToast();

  const loadScenarios = useCallback(async () => {
    try {
      setLoading(true);
      const planRes = await fetch("/api/plans/current");
      const planData = await planRes.json();
      if (!planData.success) throw new Error(planData.error);
      setPlanId(planData.data.id);

      const scenRes = await fetch(
        `/api/scenarios?planId=${planData.data.id}`
      );
      const scenData = await scenRes.json();
      if (!scenData.success) throw new Error(scenData.error);
      setScenarios(scenData.data);

      if (scenData.data.length > 0) {
        setSelectedIds(scenData.data.map((s: Scenario) => s.id));
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
    if (!planId || !newName.trim()) return;
    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          name: newName.trim(),
          config: DEFAULT_REVENUE_CONFIG,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast(`Scenario "${newName.trim()}" created`);
      setNewName("");
      loadScenarios();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to create scenario",
        "error"
      );
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
          config: scenario.config ?? DEFAULT_REVENUE_CONFIG,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast(`Duplicated "${scenario.name}"`);
      loadScenarios();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to duplicate",
        "error"
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/scenarios/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast("Scenario deleted");
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
      loadScenarios();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to delete",
        "error"
      );
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

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
            const point: { date: string; [key: string]: string | number } = { date: m.date };
            forecasts.forEach((f) => {
              const fMonth = f.months.find(
                (fm) => fm.date === m.date
              ) ?? f.months[idx];
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
      <main className="min-h-screen bg-slate-50">
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
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="space-y-8">
          <PageHeader
            title="Scenarios"
            subtitle="Compare different revenue assumptions side by side."
            actions={
              <Link
                href="/app/revenue"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Edit revenue
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />

          {/* Create scenario */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Your scenarios
            </h2>
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New scenario name (e.g. Aggressive growth)"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Create
              </button>
            </div>

            {scenarios.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">
                No scenarios yet. Save your revenue config first, then create
                alternative scenarios here.
              </p>
            ) : (
              <div className="space-y-2">
                {scenarios.map((s, i) => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition ${
                      selectedIds.includes(s.id)
                        ? "border-indigo-200 bg-indigo-50/50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {s.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDuplicate(s)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 transition"
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      {s.name !== "Default" && (
                        <button
                          onClick={() => setDeleteTarget(s)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition"
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
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600 mr-2" />
              <span className="text-sm text-slate-600">
                Running forecast comparison...
              </span>
            </div>
          )}

          {forecasts.length >= 2 && !comparing && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
                    <GitCompareArrows className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Comparison
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                    <tbody className="divide-y divide-slate-200">
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
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <GitCompareArrows className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                Select at least 2 scenarios to compare
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Check multiple scenarios above to see a side-by-side comparison.
              </p>
            </div>
          )}

          <ConfirmDialog
            open={deleteTarget !== null}
            title="Delete scenario?"
            description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
            onConfirm={() => {
              if (deleteTarget) handleDelete(deleteTarget.id);
              setDeleteTarget(null);
            }}
            onCancel={() => setDeleteTarget(null)}
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
    <tr className="hover:bg-slate-50/60">
      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
        {label}
      </td>
      {values.map((v, i) => (
        <td
          key={i}
          className="whitespace-nowrap px-4 py-3 text-sm text-right font-semibold tabular-nums text-slate-700"
        >
          {v}
        </td>
      ))}
    </tr>
  );
}
