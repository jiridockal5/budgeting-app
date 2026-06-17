"use client";

import { useMemo } from "react";
import {
  VisSingleContainer,
  VisDonut,
  VisTooltip,
  VisBulletLegend,
} from "@unovis/react";
import { Donut } from "@unovis/ts";
import { ChartShell } from "@/components/charts/ChartShell";
import { MRR_MIX_COLORS } from "@/lib/chartTheme";
import type { NetNewArrMix } from "@/lib/revenueForecast";
import { formatPct } from "./formatters";

interface NetNewArrMixChartProps {
  mix: NetNewArrMix;
  totalNewMrr: number;
  totalExpansionMrr: number;
  totalChurnedMrr: number;
}

interface MixDatum {
  name: string;
  value: number;
  pct: number;
}

export function NetNewArrMixChart({
  mix,
  totalNewMrr,
  totalExpansionMrr,
  totalChurnedMrr,
}: NetNewArrMixChartProps) {
  const data = useMemo(
    () =>
      [
        { name: "New MRR", value: totalNewMrr, pct: mix.newPct },
        { name: "Expansion MRR", value: totalExpansionMrr, pct: mix.expansionPct },
        { name: "Churned MRR", value: totalChurnedMrr, pct: mix.churnPct },
      ].filter((d) => d.value > 0),
    [mix, totalNewMrr, totalExpansionMrr, totalChurnedMrr]
  );

  const tooltipTriggers = useMemo(
    () => ({
      [Donut.selectors.segment]: (d: MixDatum) =>
        `<div style="font-size:13px"><strong>${d.name}</strong><br/>${formatPct(d.pct)} of movement</div>`,
    }),
    []
  );

  if (data.length === 0) return null;

  return (
    <ChartShell
      title="Net New ARR Mix"
      description="Composition of MRR movement over the forecast period."
    >
      <VisSingleContainer data={data} height="100%">
        <VisDonut<MixDatum>
          value={(d) => d.value}
          color={(d) => MRR_MIX_COLORS[d.name] ?? "#a3a3a3"}
          arcWidth={30}
          padAngle={0.02}
          cornerRadius={2}
        />
        <VisTooltip triggers={tooltipTriggers} />
      </VisSingleContainer>
      <div className="mt-3 flex justify-center">
        <VisBulletLegend
          className="chart-legend"
          items={data.map((d) => ({
            name: d.name,
            color: MRR_MIX_COLORS[d.name] ?? "#a3a3a3",
          }))}
        />
      </div>
    </ChartShell>
  );
}
