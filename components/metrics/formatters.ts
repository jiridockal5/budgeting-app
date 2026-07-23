import { formatCompactCurrency } from "@/lib/currency";

export function formatCompact(value: number): string {
  return formatCompactCurrency(value);
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
