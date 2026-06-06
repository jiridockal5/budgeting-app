import { formatCurrency } from "@/lib/assumptions";

export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000)
    return `€${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `€${Math.round(value / 1_000)}K`;
  return formatCurrency(Math.round(value));
}

export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatSignedCompact(value: number): string {
  const prefix = value < 0 ? "−" : "";
  return `${prefix}${formatCompact(Math.abs(value))}`;
}

/** "2025-06" → "June 2025" */
export function formatMonthLabel(date: string): string {
  const [year, month] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Compact column header: "Jan '25" */
export function formatMonthColumn(date: string): string {
  const [year, month] = date.split("-").map(Number);
  const short = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(
    "en-GB",
    { month: "short", timeZone: "UTC" }
  );
  return `${short} '${String(year).slice(-2)}`;
}
