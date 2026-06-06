/**
 * Expense Categories and Types
 *
 * Shared type definitions for expense categorization used across the
 * Expenses page and forecasting logic.
 *
 * Categories align with standard B2B SaaS reporting:
 * - COS (Cost of Sales / Cost of Revenue)
 * - GTM (Go-to-Market: Sales, Marketing, BD)
 * - R&D (Product & Engineering)
 * - CS (Customer Support & Success)
 * - Ops (Operations & G&A)
 */

/**
 * Standard B2B SaaS expense categories
 */
export type ExpenseCategory =
  | "cos" // Cost of sales / cost of revenue
  | "gtm" // GTM – sales, marketing, business development
  | "rnd" // R&D – product & engineering
  | "cs" // Customer support & success
  | "ops"; // Operations & G&A

/**
 * Human-readable labels for expense categories
 */
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  cos: "Cost of sales / Cost of revenue",
  gtm: "GTM – Sales, Marketing, Business Development",
  rnd: "R&D – Product & Engineering",
  cs: "Customer Support & Success",
  ops: "Operations & G&A",
};

/**
 * Short labels for compact UI display
 */
export const EXPENSE_CATEGORY_SHORT_LABELS: Record<ExpenseCategory, string> = {
  cos: "Cost of Sales",
  gtm: "GTM",
  rnd: "R&D",
  cs: "Customer Success",
  ops: "Operations & G&A",
};

/**
 * All expense categories as an array for iteration
 */
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "cos",
  "gtm",
  "rnd",
  "cs",
  "ops",
];

/**
 * Employment type for a people-cost line.
 * Employer payroll tax only applies to "employee" by default.
 */
export type PersonType = "employee" | "contractor" | "advisor";

export const PERSON_TYPES: PersonType[] = ["employee", "contractor", "advisor"];

export const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  employee: "Employee",
  contractor: "Contractor",
  advisor: "Advisor",
};

/** Whether employer payroll tax (salaryTaxRate) applies to a given person type. */
export function personTypeHasEmployerTax(type: string): boolean {
  return type === "employee";
}

/**
 * Headcount row type for tracking people costs
 */
export type HeadcountRow = {
  id: string;
  role: string;
  type: PersonType;
  category: ExpenseCategory;
  baseSalary: number; // monthly gross salary in EUR
  fte: number; // 1.0, 0.8, etc.
  startMonth: string; // ISO string "2025-01" or similar
  endMonth?: string; // last active month (departures)
};

/**
 * Non-headcount expense row type for tracking operational costs
 */
export type NonHeadcountExpenseRow = {
  id: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  frequency: "monthly" | "annual" | "one_time";
  startMonth: string;
  endMonth?: string;
  config?: CostModel | null;
};

/**
 * Frequency options for non-headcount expenses
 */
export const EXPENSE_FREQUENCY_OPTIONS: {
  label: string;
  value: NonHeadcountExpenseRow["frequency"];
}[] = [
  { label: "Monthly", value: "monthly" },
  { label: "Annual", value: "annual" },
  { label: "One-time", value: "one_time" },
];

/**
 * Format frequency for display
 */
export function formatFrequency(
  frequency: NonHeadcountExpenseRow["frequency"]
): string {
  switch (frequency) {
    case "monthly":
      return "Monthly";
    case "annual":
      return "Annual";
    case "one_time":
      return "One-time";
  }
}

// ============================================================================
// Flexible cost model
// ============================================================================
//
// Every non-people expense can optionally carry a `CostModel` (stored in the
// `Expense.config` JSON column). When absent, the line behaves like a plain
// fixed amount + frequency adjusted by global inflation (legacy behavior).
//
// All percentages are whole numbers (e.g. 15 = 15%). Months are "YYYY-MM".

/** How a line's base monthly amount is derived. */
export type CostMethod =
  | "fixed"
  | "growing"
  | "percentOfRevenue"
  | "perCustomer"
  | "perEmployee";

/** Which revenue base a percent-of-revenue cost scales with. */
export type RevenueBase = "total" | "plg" | "sales" | "partners";

/** A scheduled change to the base amount, effective from `month` onward. */
export interface CostStep {
  month: string; // "YYYY-MM" the new base takes effect
  amount: number; // new base amount in EUR
}

export interface FixedCostModel {
  method: "fixed";
}

export interface GrowingCostModel {
  method: "growing";
  growthRate: number; // percentage
  growthPeriod: "year" | "month";
  growthMode: "compound" | "linear";
}

export interface PercentOfRevenueCostModel {
  method: "percentOfRevenue";
  percent: number; // percentage of the revenue base
  revenueBase: RevenueBase;
}

export interface PerCustomerCostModel {
  method: "perCustomer";
  amountPerUnit: number; // EUR per customer per month
  customerBasis: "active" | "new";
  stream?: RevenueBase; // defaults to "total"
}

export interface PerEmployeeCostModel {
  method: "perEmployee";
  amountPerUnit: number; // EUR per head per month
  employeeBasis: "fte" | "count";
  employeeCategory?: ExpenseCategory; // restrict to a category, else all people
}

export type CostMethodModel =
  | FixedCostModel
  | GrowingCostModel
  | PercentOfRevenueCostModel
  | PerCustomerCostModel
  | PerEmployeeCostModel;

/**
 * Optional flexible configuration attached to an expense line.
 * `overrides` and `steps` apply on top of whichever method is selected.
 */
export type CostModel = CostMethodModel & {
  steps?: CostStep[];
  overrides?: Record<string, number>; // "YYYY-MM" -> explicit monthly amount
};

export const COST_METHOD_LABELS: Record<CostMethod, string> = {
  fixed: "Fixed amount",
  growing: "Grows over time",
  percentOfRevenue: "% of revenue",
  perCustomer: "Per customer",
  perEmployee: "Per employee",
};

export const REVENUE_BASE_LABELS: Record<RevenueBase, string> = {
  total: "Total MRR",
  plg: "PLG MRR",
  sales: "Sales MRR",
  partners: "Partner MRR",
};

/**
 * Type guard / parser for a stored cost model. Returns null for legacy rows so
 * callers can fall back to fixed-amount behavior.
 */
export function parseCostModel(value: unknown): CostModel | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.method !== "string") return null;
  if (
    !["fixed", "growing", "percentOfRevenue", "perCustomer", "perEmployee"].includes(
      v.method
    )
  ) {
    return null;
  }
  return value as CostModel;
}

/** Short human-readable badge describing a cost model, for table rows. */
export function describeCostModel(model: CostModel | null): string {
  if (!model || model.method === "fixed") return "Fixed";
  switch (model.method) {
    case "growing": {
      const sign = model.growthRate >= 0 ? "+" : "";
      return `${sign}${model.growthRate}%/${model.growthPeriod === "month" ? "mo" : "yr"}`;
    }
    case "percentOfRevenue":
      return `${model.percent}% of ${REVENUE_BASE_LABELS[model.revenueBase]}`;
    case "perCustomer":
      return `${model.amountPerUnit}/${model.customerBasis === "new" ? "new cust." : "customer"}`;
    case "perEmployee":
      return `${model.amountPerUnit}/${model.employeeBasis === "count" ? "head" : "FTE"}`;
  }
}

