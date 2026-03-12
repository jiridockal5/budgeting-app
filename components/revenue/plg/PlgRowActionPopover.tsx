"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MoreHorizontal,
  X,
  TrendingUp,
  Calendar,
  RotateCcw,
  ArrowRight,
  Hash,
} from "lucide-react";
import type { PlgMetricRow, PlgMetricKey } from "@/lib/revenueForecast";
import {
  PLG_METRIC_META,
  SEASONALITY_PRESETS,
} from "@/lib/plgForecast";

interface PlgRowActionPopoverProps {
  metricKey: PlgMetricKey;
  row: PlgMetricRow;
  numMonths: number;
  onUpdate: (updater: PlgMetricRow | ((prev: PlgMetricRow) => PlgMetricRow)) => void;
}

export function PlgRowActionPopover({
  metricKey,
  row,
  numMonths,
  onUpdate,
}: PlgRowActionPopoverProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const meta = PLG_METRIC_META[metricKey];

  const [defaultVal, setDefaultVal] = useState(String(row.defaultValue));
  const [growthPct, setGrowthPct] = useState(
    row.growthPct !== null ? String(row.growthPct) : ""
  );
  const [growthStart, setGrowthStart] = useState(row.growthStartMonth);
  const [seasonalityKey, setSeasonalityKey] = useState<string>(
    row.seasonality
      ? SEASONALITY_PRESETS.find(
          (p) => JSON.stringify(p.multipliers) === JSON.stringify(row.seasonality)
        )?.key ?? "custom"
      : "none"
  );
  const [fillFromMonth, setFillFromMonth] = useState(0);
  const [fillValue, setFillValue] = useState(String(row.defaultValue));

  useEffect(() => {
    setDefaultVal(String(row.defaultValue));
    setGrowthPct(row.growthPct !== null ? String(row.growthPct) : "");
    setGrowthStart(row.growthStartMonth);
    setSeasonalityKey(
      row.seasonality
        ? SEASONALITY_PRESETS.find(
            (p) =>
              JSON.stringify(p.multipliers) === JSON.stringify(row.seasonality)
          )?.key ?? "custom"
        : "none"
    );
  }, [row]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const applyDefault = useCallback(() => {
    const val = parseFloat(defaultVal);
    if (isNaN(val)) return;
    onUpdate((prev) => ({ ...prev, defaultValue: val }));
  }, [defaultVal, onUpdate]);

  const applyGrowth = useCallback(() => {
    const pct = growthPct === "" ? null : parseFloat(growthPct);
    if (pct !== null && isNaN(pct)) return;
    onUpdate((prev) => ({
      ...prev,
      growthPct: pct,
      growthStartMonth: growthStart,
    }));
  }, [growthPct, growthStart, onUpdate]);

  const applySeasonality = useCallback(() => {
    const preset = SEASONALITY_PRESETS.find((p) => p.key === seasonalityKey);
    const multipliers =
      !preset || seasonalityKey === "none" ? null : preset.multipliers;
    onUpdate((prev) => ({ ...prev, seasonality: multipliers }));
  }, [seasonalityKey, onUpdate]);

  const applyFillRight = useCallback(() => {
    const val = parseFloat(fillValue);
    if (isNaN(val)) return;
    onUpdate((prev) => {
      const overrides = { ...prev.overrides };
      for (let i = fillFromMonth; i < numMonths; i++) {
        overrides[i] = val;
      }
      return { ...prev, overrides };
    });
  }, [fillValue, fillFromMonth, numMonths, onUpdate]);

  const clearOverrides = useCallback(() => {
    onUpdate((prev) => ({ ...prev, overrides: {} }));
  }, [onUpdate]);

  const overrideCount = Object.keys(row.overrides).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        title="Row actions"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-1 z-50 w-72 rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h4 className="text-sm font-semibold text-slate-900">
              {meta.label}
            </h4>
            <button
              onClick={() => setOpen(false)}
              className="p-0.5 rounded text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
            {/* Default value */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <Hash className="h-3 w-3" />
                Default value
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  value={defaultVal}
                  onChange={(e) => setDefaultVal(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  onClick={applyDefault}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Grow by % */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <TrendingUp className="h-3 w-3" />
                Grow by % per month
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 5"
                  value={growthPct}
                  onChange={(e) => setGrowthPct(e.target.value)}
                  className="w-20 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <span className="text-xs text-slate-500">% from month</span>
                <select
                  value={growthStart}
                  onChange={(e) => setGrowthStart(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  {Array.from({ length: numMonths }, (_, i) => (
                    <option key={i} value={i}>
                      M{i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={applyGrowth}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                {growthPct === "" ? "Remove growth" : "Apply growth"}
              </button>
            </div>

            {/* Seasonality */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <Calendar className="h-3 w-3" />
                Seasonality
              </label>
              <select
                value={seasonalityKey}
                onChange={(e) => setSeasonalityKey(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                {SEASONALITY_PRESETS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label} \u2014 {p.description}
                  </option>
                ))}
              </select>
              <button
                onClick={applySeasonality}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Apply seasonality
              </button>
            </div>

            {/* Fill right */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <ArrowRight className="h-3 w-3" />
                Fill right
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  step="any"
                  value={fillValue}
                  onChange={(e) => setFillValue(e.target.value)}
                  className="w-24 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <span className="text-xs text-slate-500">from</span>
                <select
                  value={fillFromMonth}
                  onChange={(e) => setFillFromMonth(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  {Array.from({ length: numMonths }, (_, i) => (
                    <option key={i} value={i}>
                      M{i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={applyFillRight}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Fill right
              </button>
            </div>

            {/* Clear overrides */}
            {overrideCount > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={clearOverrides}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear {overrideCount} override{overrideCount !== 1 ? "s" : ""}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
