import { z } from "zod";
import { expenseCategorySchema } from "@/lib/schemas/expenseCategory";

/** "YYYY-MM" month key */
const monthKey = z.string().regex(/^\d{4}-\d{2}$/, "Expected YYYY-MM");

const revenueBaseSchema = z.enum(["total", "plg", "sales", "partners"]);

const stepSchema = z.object({
  month: monthKey,
  amount: z.number().finite(),
});

const baseExtras = {
  steps: z.array(stepSchema).optional(),
  overrides: z.record(monthKey, z.number().finite()).optional(),
};

/**
 * Validates the optional flexible cost model stored on `Expense.config`.
 * Kept permissive about extra schedule fields so methods compose with
 * steps + per-month overrides.
 */
export const costModelSchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("fixed"), ...baseExtras }),
  z.object({
    method: z.literal("growing"),
    growthRate: z.number().finite(),
    growthPeriod: z.enum(["year", "month"]),
    growthMode: z.enum(["compound", "linear"]),
    ...baseExtras,
  }),
  z.object({
    method: z.literal("percentOfRevenue"),
    percent: z.number().finite(),
    revenueBase: revenueBaseSchema,
    ...baseExtras,
  }),
  z.object({
    method: z.literal("perCustomer"),
    amountPerUnit: z.number().finite(),
    customerBasis: z.enum(["active", "new"]),
    stream: revenueBaseSchema.optional(),
    ...baseExtras,
  }),
  z.object({
    method: z.literal("perEmployee"),
    amountPerUnit: z.number().finite(),
    employeeBasis: z.enum(["fte", "count"]),
    employeeCategory: expenseCategorySchema.optional(),
    ...baseExtras,
  }),
]);

export type CostModelInput = z.infer<typeof costModelSchema>;
