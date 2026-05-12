import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import type { Expense } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { expenseCategorySchema } from "@/lib/schemas/expenseCategory";
import { jsonErr, jsonOk, jsonServerError } from "@/lib/server/apiEnvelope";
import { getScopedPlan } from "@/lib/server/planScope";

const frequencyEnum = z.enum(["MONTHLY", "ONE_TIME", "YEARLY"]);

const expenseUpdateSchema = z.object({
  planId: z.string().min(1),
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
});

function serializeExpense(expense: Expense) {
  return {
    ...expense,
    amount:
      expense.amount instanceof Prisma.Decimal
        ? expense.amount.toNumber()
        : Number(expense.amount),
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
    const scoped = await getScopedPlan(input.planId);
    if (!scoped.ok) return scoped.response;

    const existing = await prisma.expense.findFirst({
      where: { id, planId: scoped.plan.id, plan: { userId: scoped.userId } },
    });

    if (!existing) {
      return jsonErr("Expense not found for this plan", 404);
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

    if (!planId) {
      return jsonErr("planId is required", 400);
    }

    const scoped = await getScopedPlan(planId);
    if (!scoped.ok) return scoped.response;

    const existing = await prisma.expense.findFirst({
      where: { id, planId: scoped.plan.id, plan: { userId: scoped.userId } },
    });

    if (!existing) {
      return jsonErr("Expense not found for this plan", 404);
    }

    await prisma.expense.delete({
      where: { id: existing.id },
    });

    return jsonOk(null);
  } catch (error) {
    return jsonServerError("DELETE /api/expenses/[id]", error);
  }
}
