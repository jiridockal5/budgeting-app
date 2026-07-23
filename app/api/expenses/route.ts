import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import type { Expense } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { expenseCategorySchema } from "@/lib/schemas/expenseCategory";
import { costModelSchema } from "@/lib/schemas/costModel";
import { jsonErr, jsonOk, jsonServerError } from "@/lib/server/apiEnvelope";
import { getScopedScenario } from "@/lib/server/planScope";

const frequencyEnum = z.enum(["MONTHLY", "ONE_TIME", "YEARLY"]);

const expenseInputSchema = z.object({
  planId: z.string().min(1),
  scenarioId: z.string().min(1),
  name: z.string().min(1),
  category: expenseCategorySchema,
  amount: z
    .preprocess((value) => {
      if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : value;
      }
      return value;
    }, z.number().finite()),
  frequency: frequencyEnum,
  startMonth: z.string().min(1),
  endMonth: z.string().optional().nullable(),
  config: costModelSchema.optional().nullable(),
});

const querySchema = z.object({
  planId: z.string().min(1),
  scenarioId: z.string().min(1),
});

function serializeExpense(expense: Expense) {
  return {
    ...expense,
    amount:
      expense.amount instanceof Prisma.Decimal
        ? expense.amount.toNumber()
        : Number(expense.amount),
    config: expense.config ?? null,
    startMonth: expense.startMonth.toISOString(),
    endMonth: expense.endMonth ? expense.endMonth.toISOString() : null,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };
}

function normalizeMonth(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid month value");
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      planId: searchParams.get("planId") ?? "",
      scenarioId: searchParams.get("scenarioId") ?? "",
    });

    if (!parsed.success) {
      return jsonErr("planId and scenarioId are required", 400);
    }

    const scoped = await getScopedScenario(parsed.data.scenarioId);
    if (!scoped.ok) return scoped.response;
    if (scoped.plan.id !== parsed.data.planId) {
      return jsonErr("Scenario does not belong to this plan", 404);
    }

    const expenses = await prisma.expense.findMany({
      where: { scenarioId: scoped.scenario.id },
      orderBy: { startMonth: "asc" },
    });

    return jsonOk(expenses.map(serializeExpense));
  } catch (error) {
    return jsonServerError("GET /api/expenses", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = expenseInputSchema.safeParse(body);

    if (!parsed.success) {
      return jsonErr("Invalid expense payload", 400);
    }

    const input = parsed.data;
    const scoped = await getScopedScenario(input.scenarioId);
    if (!scoped.ok) return scoped.response;
    if (scoped.plan.id !== input.planId) {
      return jsonErr("Scenario does not belong to this plan", 404);
    }

    const expense = await prisma.expense.create({
      data: {
        planId: scoped.plan.id,
        scenarioId: scoped.scenario.id,
        name: input.name,
        category: input.category,
        amount: input.amount,
        frequency: input.frequency,
        startMonth: normalizeMonth(input.startMonth),
        endMonth: input.endMonth ? normalizeMonth(input.endMonth) : null,
        config: input.config ?? Prisma.DbNull,
      },
    });

    return jsonOk(serializeExpense(expense), 201);
  } catch (error) {
    return jsonServerError("POST /api/expenses", error);
  }
}
