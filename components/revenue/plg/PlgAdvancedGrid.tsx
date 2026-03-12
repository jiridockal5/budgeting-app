"use client";

import { useMemo, useCallback } from "react";
import { HelpCircle } from "lucide-react";
import type {
  PlgAdvancedConfig,
  PlgMetricKey,
  PlgMetricRow,
} from "@/lib/revenueForecast";
import { PLG_METRIC_KEYS, addMonths } from "@/lib/revenueForecast";
import { PLG_METRIC_META, resolveMonthlyValues } from "@/lib/plgForecast";
import { PlgCellInput } from "./PlgCellInput";
import { PlgRowActionPopover } from "./PlgRowActionPopover";

interface PlgAdvancedGridProps {
  config: PlgAdvancedConfig;
  onUpdateMetric: (
    key: PlgMetricKey,
    updater: PlgMetricRow | ((prev: PlgMetricRow) => PlgMetricRow)
  ) => void;
  startMonth: string;
  numMonths: number;
}

function formatMonthHeader(startMonth: string, index: number): string {
  const date = addMonths(startMonth, index);
  const [year, month] = date.split("-").map(Number);
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${monthNames[month - 1]} ${String(year).slice(2)}`;
}

function MetricRowView({
  metricKey,
  row,
  numMonths,
  startMonth,
  onUpdate,
}: {
  metricKey: PlgMetricKey;
  row: PlgMetricRow;
  numMonths: number;
  startMonth: string;
  onUpdate: (updater: PlgMetricRow | ((prev: PlgMetricRow) => PlgMetricRow)) => void;
}) {
  const meta = PLG_METRIC_META[metricKey];

  const resolvedValues = useMemo(
    () => resolveMonthlyValues(row, numMonths),
    [row, numMonths]
  );

  const handleCellOverride = useCallback(
    (monthIndex: number, value: number) => {
      onUpdate((prev) => ({
        ...prev,
        overrides: { ...prev.overrides, [monthIndex]: value },
      }));
    },
    [onUpdate]
  );

  const handleClearOverride = useCallback(
    (monthIndex: number) => {
      onUpdate((prev) => {
        const overrides = { ...prev.overrides };
        delete overrides[monthIndex];
        return { ...prev, overrides };
      });
    },
    [onUpdate]
  );

  const hasRules =
    row.growthPct !== null || row.seasonality !== null;
  const overrideCount = Object.keys(row.overrides).length;

  return (
    <tr className="group border-b border-slate-100 last:border-b-0">
      {/* Frozen label column */}
      <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/80 transition-colors">
        <div className="flex items-center gap-1.5 px-3 py-2.5 min-w-[200px]">
          <PlgRowActionPopover
            metricKey={metricKey}
            row={row}
            numMonths={numMonths}
            onUpdate={onUpdate}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-slate-800 truncate">
                {meta.label}
              </span>
              <div className="relative group/tip">
                <HelpCircle className="h-3 w-3 text-slate-300 hover:text-slate-500 cursor-help flex-shrink-0" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg whitespace-normal w-56 opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity z-20 shadow-lg">
                  {meta.tooltip}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-slate-400 leading-tight truncate">
                {meta.helper}
              </span>
              {hasRules && (
                <span className="flex-shrink-0 inline-flex items-center px-1 py-0 rounded text-[9px] font-medium bg-emerald-50 text-emerald-600">
                  rules
                </span>
              )}
              {overrideCount > 0 && (
                <span className="flex-shrink-0 inline-flex items-center px-1 py-0 rounded text-[9px] font-medium bg-indigo-50 text-indigo-600">
                  {overrideCount} edit{overrideCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Month cells */}
      {resolvedValues.map((value, i) => (
        <td
          key={i}
          className="px-0 py-0 border-l border-slate-50 group-hover:bg-slate-50/40 transition-colors"
        >
          <PlgCellInput
            value={value}
            isOverride={i in row.overrides}
            decimals={meta.decimals}
            prefix={meta.prefix}
            suffix={meta.suffix}
            onChange={(v) => handleCellOverride(i, v)}
            onClearOverride={() => handleClearOverride(i)}
          />
        </td>
      ))}
    </tr>
  );
}

export function PlgAdvancedGrid({
  config,
  onUpdateMetric,
  startMonth,
  numMonths,
}: PlgAdvancedGridProps) {
  const monthHeaders = useMemo(
    () =>
      Array.from({ length: numMonths }, (_, i) =>
        formatMonthHeader(startMonth, i)
      ),
    [startMonth, numMonths]
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2.5 text-left text-xs font-semibold text-slate-500 min-w-[200px]">
                Metric
              </th>
              {monthHeaders.map((header, i) => (
                <th
                  key={i}
                  className="px-1.5 py-2.5 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wide min-w-[72px] whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLG_METRIC_KEYS.map((key) => (
              <MetricRowView
                key={key}
                metricKey={key}
                row={config.metrics[key]}
                numMonths={numMonths}
                startMonth={startMonth}
                onUpdate={(updater) => onUpdateMetric(key, updater)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
