"use client";

import { useCallback, useMemo } from "react";
import {
  VisXYContainer,
  VisStackedBar,
  VisLine,
  VisAxis,
  VisTooltip,
} from "@unovis/react";
import { StackedBar, Line } from "@unovis/ts";
import { ChartShell } from "@/components/charts/ChartShell";
import { ChartLegend } from "@/components/charts/ChartLegend";
import {
  PNL_BAR_COLORS,
  indexAccessor,
  indexData,
  makeTickLabelFormatter,
  sampleMonths,
} from "@/lib/chartTheme";
import type { ForecastMonth } from "@/lib/revenueForecast";
import { formatCompact } from "./formatters";

interface PnlChartProps {
  months: ForecastMonth[];
}

const OPEX_KEYS = ["cos", "gtm", "rnd", "cs", "ops"] as const;
const OPEX_LABELS = ["Cost of Sales", "GTM", "R&D", "CS", "Ops"];

interface PnlDatum {
  date: string;
  revenue: number;
  cos: number;
  gtm: number;
  rnd: number;
  cs: number;
  ops: number;
  ebit: number;
  index: number;
}

export function PnlChart({ months }: PnlChartProps) {
  const data = useMemo(
    () =>
      indexData(
        sampleMonths(months).map((m) => ({
          date: m.date,
          revenue: Math.round(m.totalMrr),
          cos: Math.round(m.cosExpense),
          gtm: Math.round(m.gtmExpense),
          rnd: Math.round(m.rndExpense),
          cs: Math.round(m.csExpense),
          ops: Math.round(m.opsExpense),
          ebit: Math.round(m.ebit),
        }))
      ),
    [months]
  );

  const labels = useMemo(() => data.map((d) => d.date), [data]);
  const x = useCallback(indexAccessor, []);
  const stackedY = useMemo(
    () => OPEX_KEYS.map((key) => (d: PnlDatum) => d[key]),
    []
  );
  const tickFormat = useMemo(() => makeTickLabelFormatter(labels), [labels]);

  const legendItems = useMemo(
    () => [
      ...OPEX_LABELS.map((name, i) => ({
        name,
        color: PNL_BAR_COLORS[i],
      })),
      { name: "Revenue", color: "#10b981" },
      { name: "EBIT", color: "#7ecfc7" },
    ],
    []
  );

  const tooltipTriggers = useMemo(
    () => ({
      [StackedBar.selectors.bar]: (_: unknown, i: number) => {
        const point = data[i];
        if (!point) return "";
        const rows = [
          ...OPEX_KEYS.map(
            (key, idx) =>
              `<div><strong>${OPEX_LABELS[idx]}</strong>: ${formatCompact(point[key])}</div>`
          ),
          `<div><strong>Revenue</strong>: ${formatCompact(point.revenue)}</div>`,
          `<div><strong>EBIT</strong>: ${formatCompact(point.ebit)}</div>`,
        ].join("");
        return `<div style="font-size:13px;line-height:1.5"><div style="margin-bottom:4px;color:#737373">${point.date}</div>${rows}</div>`;
      },
      [Line.selectors.line]: (_: unknown, i: number) => {
        const point = data[i];
        if (!point) return "";
        return `<div style="font-size:13px"><strong>${point.date}</strong></div>`;
      },
    }),
    [data]
  );

  if (months.length === 0) return null;

  return (
    <ChartShell
      title="Monthly P&L"
      description="Recognized revenue, cost of sales, operating expenses, and EBIT over time."
      chartHeightClass="h-72"
    >
      <VisXYContainer data={data} height="100%">
        <VisStackedBar
          x={x}
          y={stackedY}
          color={(_, i) => PNL_BAR_COLORS[i] ?? "#a3a3a3"}
          roundedCorners={4}
        />
        <VisLine
          x={x}
          y={(d: PnlDatum) => d.revenue}
          color={() => "#10b981"}
        />
        <VisLine
          x={x}
          y={(d: PnlDatum) => d.ebit}
          color={() => "#7ecfc7"}
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
