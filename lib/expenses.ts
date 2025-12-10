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
 * Headcount row type for tracking people costs
 */
export type HeadcountRow = {
  id: string;
  role: string;
  category: ExpenseCategory;
  baseSalary: number; // monthly gross salary in EUR
  fte: number; // 1.0, 0.8, etc.
  startMonth: string; // ISO string "2025-01" or similar
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

