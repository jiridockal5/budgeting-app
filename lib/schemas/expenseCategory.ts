import { z } from "zod";

/** Must match EXPENSE_CATEGORIES in @/lib/expenses */
export const expenseCategorySchema = z.enum([
  "cos",
  "gtm",
  "rnd",
  "cs",
  "ops",
]);
