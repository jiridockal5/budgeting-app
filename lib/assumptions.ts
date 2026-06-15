/**
 * Global Assumptions Module
 *
 * Defines the global default drivers that power cash-flow, income, and expense
 * forecasts for the current plan.
 */

export interface CashFundraisingAssumptions {
  /** Starting cash balance in EUR */
  cashOnHand: number;
  /** Expected month when planned savings or outside cash is received ("YYYY-MM") */
  plannedRaiseMonth: string | null;
  /** Expected gross cash from the next planned savings event */
  plannedRaiseAmount: number | null;
  /** Estimated fees or planning buffer (%) */
  fundraisingFees: number;
  /** Minimum desired cash balance in EUR */
  minCashBuffer: number | null;
  /** Target cash cushion threshold in months */
  targetRunwayMonths: number | null;
}

export interface RevenueDefaultAssumptions {
  /** Monthly income reduction rate (percentage, e.g., 3 = 3%) */
  churnRate: number;
  /** Monthly income increase rate on retained sources (percentage, e.g., 5 = 5%) */
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
  cashOnHand: 500000,
  plannedRaiseMonth: null,
  plannedRaiseAmount: null,
  fundraisingFees: 0,
  minCashBuffer: 100000,
  targetRunwayMonths: 18,
  churnRate: 3,
  expansionRate: 5,
  paymentTimingDays: 30,
  priceUplift: null,
  salaryTaxRate: 35,
  salaryGrowthRate: 5,
  commissionRate: 10,
  inflationRate: 2,
  baseAcv: 12000,
};

/**
 * Helper text for each assumption field.
 * Used to provide context in the UI form and summaries.
 */
export const ASSUMPTION_HELPERS: Record<keyof GlobalAssumptions, string> = {
  cashOnHand: "Cash available at the beginning of the forecast period.",
  plannedRaiseMonth: "Expected month when planned savings or outside cash is received.",
  plannedRaiseAmount:
    "Expected gross cash from the next planned savings event.",
  fundraisingFees:
    "Estimated fees, taxes, or planning buffer for the goal.",
  minCashBuffer:
    "Safety threshold used to evaluate whether the plan keeps enough cash available.",
  targetRunwayMonths:
    "Desired number of months your cash should cover.",
  churnRate:
    "Baseline monthly income reduction used unless overridden elsewhere.",
  expansionRate:
    "Default monthly increase on retained income, used in forecast retention metrics.",
  paymentTimingDays:
    "Average delay between invoicing and cash collection.",
  priceUplift: "Optional default annual increase in income.",
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
 * Formats a number as currency (EUR)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
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

