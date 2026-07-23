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

const expenseUpdateSchema = z.object({
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

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = expenseUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return jsonErr("Invalid expense payload", 400);
    }

    const input = parsed.data;
    const scoped = await getScopedScenario(input.scenarioId);
    if (!scoped.ok) return scoped.response;
    if (scoped.plan.id !== input.planId) {
      return jsonErr("Scenario does not belong to this plan", 404);
    }

    const existing = await prisma.expense.findFirst({
      where: {
        id,
        scenarioId: scoped.scenario.id,
        planId: scoped.plan.id,
      },
    });

    if (!existing) {
      return jsonErr("Expense not found for this scenario", 404);
    }

    const updated = await prisma.expense.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        category: input.category,
        amount: input.amount,
        frequency: input.frequency,
        startMonth: normalizeMonth(input.startMonth),
        endMonth: input.endMonth ? normalizeMonth(input.endMonth) : null,
        config:
          input.config === undefined
            ? undefined
            : input.config ?? Prisma.DbNull,
      },
    });

    return jsonOk(serializeExpense(updated));
  } catch (error) {
    return jsonServerError("PUT /api/expenses/[id]", error);
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("planId");
    const scenarioId = searchParams.get("scenarioId");

    if (!planId || !scenarioId) {
      return jsonErr("planId and scenarioId are required", 400);
    }

    const scoped = await getScopedScenario(scenarioId);
    if (!scoped.ok) return scoped.response;
    if (scoped.plan.id !== planId) {
      return jsonErr("Scenario does not belong to this plan", 404);
    }

    const existing = await prisma.expense.findFirst({
      where: {
        id,
        scenarioId: scoped.scenario.id,
        planId: scoped.plan.id,
      },
    });

    if (!existing) {
      return jsonErr("Expense not found for this scenario", 404);
    }

    await prisma.expense.delete({
      where: { id: existing.id },
    });

    return jsonOk(null);
  } catch (error) {
    return jsonServerError("DELETE /api/expenses/[id]", error);
  }
}
