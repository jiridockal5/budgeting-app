"use client";

import { useCallback, useMemo } from "react";
import {
  VisXYContainer,
  VisStackedBar,
  VisAxis,
  VisTooltip,
} from "@unovis/react";
import { StackedBar } from "@unovis/ts";
import { ChartShell } from "@/components/charts/ChartShell";
import { ChartLegend } from "@/components/charts/ChartLegend";
import {
  defaultCurrencyFormat,
  indexAccessor,
  indexData,
  makeTickLabelFormatter,
  sampleMonths,
} from "@/lib/chartTheme";
import type { ForecastMonth } from "@/lib/revenueForecast";

interface StackedExpenseChartProps {
  months: ForecastMonth[];
}

interface ExpenseDatum {
  date: string;
  headcount: number;
  nonHeadcount: number;
  index: number;
}

const SERIES = [
  { key: "headcount" as const, name: "Headcount", color: "#5bb5aa" },
  { key: "nonHeadcount" as const, name: "Non-headcount", color: "#f59e0b" },
];

export function StackedExpenseChart({ months }: StackedExpenseChartProps) {
  const data = useMemo(
    () =>
      months.length === 0
        ? []
        : indexData(
            sampleMonths(months).map((m) => ({
              date: m.date,
              headcount: Math.round(m.headcountExpense),
              nonHeadcount: Math.round(m.nonHeadcountExpense),
            }))
          ),
    [months]
  );

  const labels = useMemo(() => data.map((d) => d.date), [data]);
  const x = useCallback(indexAccessor, []);
  const y = useMemo(
    () => SERIES.map((s) => (d: ExpenseDatum) => d[s.key]),
    []
  );
  const tickFormat = useMemo(() => makeTickLabelFormatter(labels), [labels]);

  const tooltipTriggers = useMemo(
    () => ({
      [StackedBar.selectors.bar]: (_: unknown, i: number) => {
        const point = data[i];
        if (!point) return "";
        const rows = SERIES.map(
          (s) =>
            `<div><strong>${s.name}</strong>: ${defaultCurrencyFormat(point[s.key])}</div>`
        ).join("");
        return `<div style="font-size:13px;line-height:1.5"><div style="margin-bottom:4px;color:#737373">${point.date}</div>${rows}</div>`;
      },
    }),
    [data]
  );

  if (data.length === 0) return null;

  return (
    <ChartShell
      title="Expense Breakdown"
      description="Headcount vs non-headcount expenses over time."
    >
      <VisXYContainer data={data} height="100%">
        <VisStackedBar
          x={x}
          y={y}
          color={(_, i) => SERIES[i]?.color ?? "#5bb5aa"}
          roundedCorners={4}
        />
        <VisAxis
          type="x"
          gridLine={false}
          domainLine
          tickLine={false}
          numTicks={Math.min(6, data.length)}
          tickFormat={tickFormat}
        />
        <VisAxis
          type="y"
          gridLine
          domainLine={false}
          tickLine={false}
          numTicks={5}
          tickFormat={(tick) => defaultCurrencyFormat(Number(tick))}
        />
        <VisTooltip triggers={tooltipTriggers} />
      </VisXYContainer>
      <ChartLegend items={SERIES.map((s) => ({ name: s.name, color: s.color }))} />
    </ChartShell>
  );
}
