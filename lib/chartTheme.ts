import { TURQUOISE } from "@/lib/turquoise";

export const CHART_PALETTE = [
  TURQUOISE[500],
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#737373",
] as const;

export const CATEGORY_COLORS = {
  cos: "#ef4444",
  gtm: "#f59e0b",
  rnd: TURQUOISE[500],
  cs: "#3b82f6",
  ops: "#737373",
} as const;

export const PNL_BAR_COLORS = [
  "#fca5a5",
  "#fcd34d",
  TURQUOISE[300],
  "#93c5fd",
  "#a3a3a3",
] as const;

export const MRR_MIX_COLORS: Record<string, string> = {
  "New MRR": "#10b981",
  "Expansion MRR": "#3b82f6",
  "Churned MRR": "#ef4444",
};

export type IndexedDatum<T> = T & { index: number };

export function indexData<T>(items: T[]): IndexedDatum<T>[] {
  return items.map((item, index) => ({ ...item, index }));
}

export function indexAccessor(d: { index: number }): number {
  return d.index;
}

export function makeTickLabelFormatter(labels: string[]) {
  return (tick: number | Date) => {
    const i = Math.round(Number(tick));
    return labels[i] ?? "";
  };
}

export function defaultCurrencyFormat(value: number): string {
  if (Math.abs(value) >= 1_000_000)
    return `€${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value.toFixed(0)}`;
}

export function sampleMonths<T>(months: T[], maxPoints = 24): T[] {
  const step = months.length > maxPoints ? Math.ceil(months.length / maxPoints) : 1;
  return months.filter((_, i) => i % step === 0 || i === months.length - 1);
}
