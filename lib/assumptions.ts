/**
 * Global Assumptions Module
 * 
 * This module defines the TypeScript interface and default values for global
 * financial assumptions that power revenue and expense forecasts.
 * 
 * TODO (later):
 * - Fetch GlobalAssumptions for the current plan from the database.
 * - Persist changes via a server action or /api/assumptions route.
 * - Wire these values into the revenue and expense forecasting logic.
 */

/**
 * Global assumptions that drive financial projections across the model.
 * These values are used in Revenue (PLG, Sales, Partners) and Expenses (headcount & costs).
 */
export interface GlobalAssumptions {
  /** Blended Customer Acquisition Cost (or CAC per primary channel) in EUR */
  cac: number;
  /** Monthly logo or revenue churn rate (percentage, e.g., 3 = 3%) */
  churnRate: number;
  /** Monthly expansion rate on surviving customers (percentage, e.g., 5 = 5%) */
  expansionRate: number;
  /** Base Annual Contract Value in EUR */
  baseAcv: number;
  /** Salary tax rate - additional cost on top of gross salary (percentage) */
  salaryTaxRate: number;
  /** Annual salary growth rate (percentage) */
  salaryGrowthRate: number;
  /** Annual inflation / general cost increase rate (percentage) */
  inflationRate: number;
}

/**
 * Default placeholder values for global assumptions.
 * These provide sensible starting points for a typical SaaS business.
 * 
 * Later: Replace with data fetched from Prisma for the current plan.
 */
export const DEFAULT_ASSUMPTIONS: GlobalAssumptions = {
  cac: 5000,           // €5,000 blended CAC
  churnRate: 3,        // 3% monthly churn
  expansionRate: 5,    // 5% monthly expansion
  baseAcv: 12000,      // €12,000 base ACV
  salaryTaxRate: 35,   // 35% on top of gross salary
  salaryGrowthRate: 5, // 5% annual salary growth
  inflationRate: 2,    // 2% annual inflation
};

/**
 * Helper text for each assumption field.
 * Used to provide context in the UI form.
 */
export const ASSUMPTION_HELPERS: Record<keyof GlobalAssumptions, string> = {
  cac: "Blended cost to acquire a new customer across all channels.",
  churnRate: "Monthly logo or revenue churn used to forecast lost MRR.",
  expansionRate: "Monthly expansion on surviving customers (upsells, seat growth).",
  baseAcv: "Starting annual contract value for new customers before upsells.",
  salaryTaxRate: "Employer contributions and taxes added on top of gross salary.",
  salaryGrowthRate: "Expected annual increase in salaries (market adjustment, promotions).",
  inflationRate: "Annual inflation rate applied to non-salary costs.",
};

/**
 * Formats a number as currency (EUR)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
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

