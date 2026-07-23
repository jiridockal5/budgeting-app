/**
 * Currency Module
 *
 * The plan's currency drives every money label in the app. Pages set the
 * active currency once when the plan loads; formatters default to it so
 * deeply nested components (charts, tables, exports) stay currency-aware
 * without prop drilling.
 */

export const SUPPORTED_CURRENCIES = ["EUR", "USD", "GBP"] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  EUR: "Euro (€)",
  USD: "US Dollar ($)",
  GBP: "British Pound (£)",
};

const SYMBOLS: Record<CurrencyCode, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
};

let activeCurrency: CurrencyCode = "EUR";

export function normalizeCurrency(code: string | null | undefined): CurrencyCode {
  const upper = (code ?? "").toUpperCase();
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(upper)
    ? (upper as CurrencyCode)
    : "EUR";
}

/** Set the currency used by default in all money formatters. */
export function setActiveCurrency(code: string | null | undefined): CurrencyCode {
  activeCurrency = normalizeCurrency(code);
  return activeCurrency;
}

export function getActiveCurrency(): CurrencyCode {
  return activeCurrency;
}

export function currencySymbol(code?: string | null): string {
  return SYMBOLS[normalizeCurrency(code ?? activeCurrency)];
}

/** Full currency format, e.g. "€12,345". */
export function formatCurrencyValue(value: number, code?: string | null): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizeCurrency(code ?? activeCurrency),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Compact currency format, e.g. "€1.2M", "€45K", "€980". */
export function formatCompactCurrency(value: number, code?: string | null): string {
  const symbol = currencySymbol(code);
  if (Math.abs(value) >= 1_000_000)
    return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000)
    return `${symbol}${Math.round(value / 1_000)}K`;
  return formatCurrencyValue(Math.round(value), code);
}
