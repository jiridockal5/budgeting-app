"use client";

import { useCallback, useMemo } from "react";
import {
  VisXYContainer,
  VisArea,
  VisAxis,
  VisTooltip,
} from "@unovis/react";
import { Area } from "@unovis/ts";
import { ChartShell } from "@/components/charts/ChartShell";
import { ChartLegend } from "@/components/charts/ChartLegend";
import {
  defaultCurrencyFormat,
  indexData,
  makeTickLabelFormatter,
} from "@/lib/chartTheme";

interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

type IndexedChartPoint = ChartDataPoint & { index: number };

interface ChartSeries {
  dataKey: string;
  name: string;
  color: string;
  stackId?: string;
}

interface ChartCardProps {
  title: string;
  description?: string;
  data?: ChartDataPoint[];
  series?: ChartSeries[];
  formatValue?: (value: number) => string;
  placeholder?: string;
}

export function ChartCard({
  title,
  description,
  data,
  series,
  formatValue = defaultCurrencyFormat,
  placeholder = "Chart coming soon",
}: ChartCardProps) {
  const hasData = Boolean(data && data.length > 0 && series && series.length > 0);
  const indexedData = useMemo(() => indexData(data ?? []), [data]);
  const isStacked = Boolean(series?.some((s) => s.stackId));
  const labels = useMemo(() => indexedData.map((d) => d.date), [indexedData]);

  const x = useCallback((d: IndexedChartPoint) => d.index, []);
  const tickFormat = useMemo(() => makeTickLabelFormatter(labels), [labels]);

  const tooltipTriggers = useMemo(() => {
    if (!series) return {};
    return {
      [Area.selectors.area]: (_: unknown, i: number) => {
        const point = indexedData[i];
        if (!point) return "";
        const rows = series
          .map((s) => {
            const value = point[s.dataKey];
            if (typeof value !== "number") return "";
            return `<div><strong>${s.name}</strong>: ${formatValue(value)}</div>`;
          })
          .filter(Boolean)
          .join("");
        return `<div style="font-size:13px;line-height:1.5"><div style="margin-bottom:4px;color:#737373">${point.date}</div>${rows}</div>`;
      },
    };
  }, [indexedData, series, formatValue]);

  return (
    <ChartShell
      title={title}
      description={description}
      hasData={hasData}
      placeholder={placeholder}
    >
      {hasData && series ? (
        <>
          <VisXYContainer data={indexedData} height="100%">
            {isStacked ? (
              <VisArea
                x={x}
                y={series.map((s) => (d: IndexedChartPoint) => Number(d[s.dataKey] ?? 0))}
                color={(_, i) => series[i]?.color ?? "#5bb5aa"}
                line
                opacity={0.25}
              />
            ) : (
              series.map((s) => (
                <VisArea
                  key={s.dataKey}
                  x={x}
                  y={(d: IndexedChartPoint) => Number(d[s.dataKey] ?? 0)}
                  color={s.color}
                  line
                  opacity={0.25}
                />
              ))
            )}
            <VisAxis
              type="x"
              gridLine={false}
              domainLine
              tickLine={false}
              numTicks={Math.min(6, indexedData.length)}
              tickFormat={tickFormat}
            />
            <VisAxis
              type="y"
              gridLine
              domainLine={false}
              tickLine={false}
              numTicks={5}
              tickFormat={(tick) => formatValue(Number(tick))}
            />
            <VisTooltip triggers={tooltipTriggers} />
          </VisXYContainer>
          <ChartLegend
            items={series.map((s) => ({ name: s.name, color: s.color }))}
          />
        </>
      ) : null}
    </ChartShell>
  );
}

export default ChartCard;
