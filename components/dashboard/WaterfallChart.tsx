"use client";

import { useCallback, useMemo } from "react";
import {
  VisXYContainer,
  VisGroupedBar,
  VisAxis,
  VisTooltip,
} from "@unovis/react";
import { GroupedBar } from "@unovis/ts";
import { ChartShell } from "@/components/charts/ChartShell";
import {
  defaultCurrencyFormat,
  indexAccessor,
  indexData,
  makeTickLabelFormatter,
} from "@/lib/chartTheme";
import type { ForecastMonth } from "@/lib/revenueForecast";

interface WaterfallChartProps {
  months: ForecastMonth[];
}

interface WaterfallDatum {
  name: string;
  value: number;
  fill: string;
  index: number;
}

export function WaterfallChart({ months }: WaterfallChartProps) {
  const data = useMemo(() => {
    if (months.length === 0) return [] as WaterfallDatum[];

    const last = months[months.length - 1];
    const first = months[0];

    return indexData([
      { name: "Starting MRR", value: first.totalMrr, fill: "#a3a3a3" },
      {
        name: "New MRR",
        value: months.reduce((sum, m) => sum + m.newMrr, 0),
        fill: "#10b981",
      },
      {
        name: "Expansion",
        value: months.reduce((sum, m) => sum + m.expansionMrr, 0),
        fill: "#3b82f6",
      },
      {
        name: "Churned",
        value: -months.reduce((sum, m) => sum + m.churnedMrr, 0),
        fill: "#ef4444",
      },
      { name: "Ending MRR", value: last.totalMrr, fill: "#7ecfc7" },
    ]);
  }, [months]);

  const labels = useMemo(() => data.map((d) => d.name), [data]);
  const x = useCallback(indexAccessor, []);
  const y = useMemo(() => [(d: WaterfallDatum) => d.value], []);
  const tickFormat = useMemo(() => makeTickLabelFormatter(labels), [labels]);

  const tooltipTriggers = useMemo(
    () => ({
      [GroupedBar.selectors.bar]: (d: WaterfallDatum) =>
        `<div style="font-size:13px"><strong>${d.name}</strong><br/>${defaultCurrencyFormat(d.value)}</div>`,
    }),
    []
  );

  if (data.length === 0) return null;

  return (
    <ChartShell
      title="MRR Waterfall"
      description="Breakdown of MRR changes over the forecast period."
    >
      <VisXYContainer data={data} height="100%">
        <VisGroupedBar
          x={x}
          y={y}
          color={(d) => d.fill}
          roundedCorners={4}
        />
        <VisAxis
          type="x"
          gridLine={false}
          domainLine
          tickLine={false}
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
    </ChartShell>
  );
}
