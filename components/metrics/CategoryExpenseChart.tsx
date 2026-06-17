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
  CATEGORY_COLORS,
  indexAccessor,
  indexData,
  makeTickLabelFormatter,
  sampleMonths,
} from "@/lib/chartTheme";
import type { ForecastMonth } from "@/lib/revenueForecast";
import { EXPENSE_CATEGORY_SHORT_LABELS } from "@/lib/expenses";
import { formatCompact } from "./formatters";

interface CategoryExpenseChartProps {
  months: ForecastMonth[];
}

const CATEGORY_KEYS = ["cos", "gtm", "rnd", "cs", "ops"] as const;

type CategoryKey = (typeof CATEGORY_KEYS)[number];

interface CategoryDatum {
  date: string;
  cos: number;
  gtm: number;
  rnd: number;
  cs: number;
  ops: number;
  index: number;
}

export function CategoryExpenseChart({ months }: CategoryExpenseChartProps) {
  const data = useMemo(
    () =>
      indexData(
        sampleMonths(months).map((m) => ({
          date: m.date,
          cos: Math.round(m.cosExpense),
          gtm: Math.round(m.gtmExpense),
          rnd: Math.round(m.rndExpense),
          cs: Math.round(m.csExpense),
          ops: Math.round(m.opsExpense),
        }))
      ),
    [months]
  );

  const labels = useMemo(() => data.map((d) => d.date), [data]);
  const x = useCallback(indexAccessor, []);
  const y = useMemo(
    () => CATEGORY_KEYS.map((key) => (d: CategoryDatum) => d[key]),
    []
  );
  const tickFormat = useMemo(() => makeTickLabelFormatter(labels), [labels]);

  const legendItems = useMemo(
    () =>
      CATEGORY_KEYS.map((key) => ({
        name: EXPENSE_CATEGORY_SHORT_LABELS[key],
        color: CATEGORY_COLORS[key],
      })),
    []
  );

  const tooltipTriggers = useMemo(
    () => ({
      [StackedBar.selectors.bar]: (_: unknown, i: number) => {
        const point = data[i];
        if (!point) return "";
        const rows = CATEGORY_KEYS.map(
          (key) =>
            `<div><strong>${EXPENSE_CATEGORY_SHORT_LABELS[key]}</strong>: ${formatCompact(point[key])}</div>`
        ).join("");
        return `<div style="font-size:13px;line-height:1.5"><div style="margin-bottom:4px;color:#737373">${point.date}</div>${rows}</div>`;
      },
    }),
    [data]
  );

  if (months.length === 0) return null;

  return (
    <ChartShell
      title="Expense by Category"
      description="Functional breakdown: COS, GTM, R&D, CS, and Ops."
    >
      <VisXYContainer data={data} height="100%">
        <VisStackedBar
          x={x}
          y={y}
          color={(_, i) => CATEGORY_COLORS[CATEGORY_KEYS[i as number] as CategoryKey]}
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
          tickFormat={(tick) => formatCompact(Number(tick))}
        />
        <VisTooltip triggers={tooltipTriggers} />
      </VisXYContainer>
      <ChartLegend items={legendItems} />
    </ChartShell>
  );
}
