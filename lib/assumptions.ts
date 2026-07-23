/**
 * Global Assumptions Module
 *
 * Defines the global default drivers that power runway, revenue, and expense
 * forecasts for the current plan.
 */

import { formatCurrencyValue } from "@/lib/currency";

export interface CashFundraisingAssumptions {
  /** Starting cash balance in EUR */
  cashOnHand: number;
  /** Expected month when funding is received ("YYYY-MM") */
  plannedRaiseMonth: string | null;
  /** Expected gross cash proceeds from the next funding round */
  plannedRaiseAmount: number | null;
  /** Estimated transaction costs / dilution friction (%) */
  fundraisingFees: number;
  /** Minimum desired cash balance in EUR */
  minCashBuffer: number | null;
  /** Target runway threshold in months */
  targetRunwayMonths: number | null;
}

export interface RevenueDefaultAssumptions {
  /** Monthly logo or revenue churn rate (percentage, e.g., 3 = 3%) */
  churnRate: number;
  /** Monthly expansion rate on surviving customers (percentage, e.g., 5 = 5%) */
  expansionRate: number;
  /** Average delay between invoicing and cash collection in days */
  paymentTimingDays: number;
  /** Optional annual pricing uplift (%) */
  priceUplift: number | null;
}

export interface TeamDefaultAssumptions {
  /** Salary tax rate - additional cost on top of gross salary (percentage) */
  salaryTaxRate: number;
  /** Annual salary growth rate (percentage) */
  salaryGrowthRate: number;
  /** Default commission / bonus rate (%) */
  commissionRate: number;
}

export interface ExpenseDefaultAssumptions {
  /** Annual inflation / general cost increase rate (percentage) */
  inflationRate: number;
}

/**
 * Global assumptions that drive financial projections across the model.
 * Flat shape is preserved for API and DB compatibility.
 */
export interface GlobalAssumptions
  extends CashFundraisingAssumptions,
    RevenueDefaultAssumptions,
    TeamDefaultAssumptions,
    ExpenseDefaultAssumptions {
  /** Legacy fallback ACV kept until configured per revenue stream */
  baseAcv: number;
}

export const DEFAULT_ASSUMPTIONS: GlobalAssumptions = {
  cashOnHand: 0,
  plannedRaiseMonth: null,
  plannedRaiseAmount: null,
  fundraisingFees: 0,
  minCashBuffer: null,
  targetRunwayMonths: null,
  churnRate: 0,
  expansionRate: 0,
  paymentTimingDays: 0,
  priceUplift: null,
  salaryTaxRate: 0,
  salaryGrowthRate: 0,
  commissionRate: 0,
  inflationRate: 0,
  baseAcv: 0,
};

/**
 * Helper text for each assumption field.
 * Used to provide context in the UI form and summaries.
 */
export const ASSUMPTION_HELPERS: Record<keyof GlobalAssumptions, string> = {
  cashOnHand: "Cash available at the beginning of the forecast period.",
  plannedRaiseMonth: "Expected month when new funding is received.",
  plannedRaiseAmount:
    "Expected gross cash proceeds from the next funding round.",
  fundraisingFees:
    "Estimated transaction costs or dilution-related funding friction.",
  minCashBuffer:
    "Safety threshold used to evaluate whether the company remains sufficiently funded.",
  targetRunwayMonths:
    "Desired number of months the company should remain funded.",
  churnRate:
    "Baseline monthly customer or revenue churn used unless overridden elsewhere.",
  expansionRate:
    "Default monthly expansion on surviving revenue, used in forecast retention metrics.",
  paymentTimingDays:
    "Average delay between invoicing and cash collection.",
  priceUplift: "Optional default annual increase in pricing.",
  salaryTaxRate:
    "Employer contributions and taxes added on top of gross salary.",
  salaryGrowthRate:
    "Default yearly compensation growth used in payroll forecasting.",
  commissionRate:
    "Default variable compensation assumption for sales or incentive-based roles.",
  inflationRate:
    "Default annual inflation applied to operating expenses unless overridden elsewhere.",
  baseAcv: "Legacy fallback annual contract value for forecast summary metrics.",
};

/**
 * Formats a number as currency using the plan's active currency
 * (see lib/currency.ts). Pass an explicit code to override.
 */
export function formatCurrency(value: number, currency?: string | null): string {
  return formatCurrencyValue(value, currency);
}

/**
 * Formats a number as percentage
 */
export function formatPercentage(value: number): string {
  return `${value} %`;
}

/**
 * Formats a year-month string for summary display.
 */
export function formatMonth(value: string | null | undefined): string {
  if (!value) return "Not set";

  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

/**
 * Normalizes API or DB assumption payloads to the flat UI shape.
 */
export function normalizeAssumptions(
  value: Partial<GlobalAssumptions> | null | undefined
): GlobalAssumptions {
  return {
    ...DEFAULT_ASSUMPTIONS,
    ...value,
    plannedRaiseMonth:
      value?.plannedRaiseMonth ?? DEFAULT_ASSUMPTIONS.plannedRaiseMonth,
    plannedRaiseAmount:
      value?.plannedRaiseAmount ?? DEFAULT_ASSUMPTIONS.plannedRaiseAmount,
    minCashBuffer: value?.minCashBuffer ?? DEFAULT_ASSUMPTIONS.minCashBuffer,
    targetRunwayMonths:
      value?.targetRunwayMonths ?? DEFAULT_ASSUMPTIONS.targetRunwayMonths,
    priceUplift: value?.priceUplift ?? DEFAULT_ASSUMPTIONS.priceUplift,
  };
}

/** True when assumptions match the blank product starter (no real inputs yet). */
export function isBlankAssumptions(
  value: Partial<GlobalAssumptions> | null | undefined
): boolean {
  const n = normalizeAssumptions(value);
  return (Object.keys(DEFAULT_ASSUMPTIONS) as (keyof GlobalAssumptions)[]).every(
    (key) => n[key] === DEFAULT_ASSUMPTIONS[key]
  );
}

