"use client";

import type { ForecastMonth } from "@/lib/revenueForecast";
import { formatCompact, formatMonthColumn, formatPct } from "./formatters";

export type MatrixValueFormat = "currency" | "percent" | "number";

export type MatrixRow =
  | {
      type: "section";
      label: string;
    }
  | {
      type: "data";
      label: string;
      indent?: boolean;
      bold?: boolean;
      format: MatrixValueFormat;
      getValue: (m: ForecastMonth) => number;
      /** Highlight negative values in red */
      colorNegative?: boolean;
    };

interface MonthlyMatrixTableProps {
  title: string;
  subtitle?: string;
  months: ForecastMonth[];
  rows: MatrixRow[];
}

function formatCell(value: number, format: MatrixValueFormat): string {
  if (format === "percent") return formatPct(value);
  if (format === "number") return value.toLocaleString("en-GB");
  return formatCompact(value);
}

export function MonthlyMatrixTable({
  title,
  subtitle,
  months,
  rows,
}: MonthlyMatrixTableProps) {
  if (months.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-200 px-6 py-4 bg-slate-50/50">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-[180px] border-r border-slate-200">
                Metric
              </th>
              {months.map((m) => (
                <th
                  key={m.date}
                  className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap min-w-[72px]"
                >
                  {formatMonthColumn(m.date)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => {
              if (row.type === "section") {
                return (
                  <tr key={`section-${idx}`} className="bg-slate-50/60">
                    <td
                      colSpan={months.length + 1}
                      className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {row.label}
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={row.label} className="hover:bg-slate-50/40">
                  <td
                    className={`sticky left-0 z-10 bg-white px-4 py-2.5 text-sm border-r border-slate-100 ${
                      row.bold
                        ? "font-semibold text-slate-900"
                        : "text-slate-600"
                    } ${row.indent ? "pl-8" : ""}`}
                  >
                    {row.label}
                  </td>
                  {months.map((m) => {
                    const value = row.getValue(m);
                    const isNegative = row.colorNegative && value < 0;
                    return (
                      <td
                        key={m.date}
                        className={`px-3 py-2.5 text-sm text-right tabular-nums whitespace-nowrap ${
                          row.bold ? "font-semibold" : ""
                        } ${isNegative ? "text-rose-600" : "text-slate-800"}`}
                      >
                        {formatCell(value, row.format)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
