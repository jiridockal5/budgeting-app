"use client";

import { VisBulletLegend } from "@unovis/react";

interface LegendItem {
  name: string;
  color: string;
}

interface ChartLegendProps {
  items: LegendItem[];
}

export function ChartLegend({ items }: ChartLegendProps) {
  if (items.length === 0) return null;

  return (
    <div className="mt-3 flex justify-center">
      <VisBulletLegend
        className="chart-legend"
        items={items.map((item) => ({
          name: item.name,
          color: item.color,
        }))}
      />
    </div>
  );
}
