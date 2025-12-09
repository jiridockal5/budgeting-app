import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/serverUser";

const frequencyEnum = z.enum(["MONTHLY", "ONE_TIME", "YEARLY"]);

const expenseUpdateSchema = z.object({
  planId: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
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

const serializeExpense = (expense: any) => ({
  ...expense,
  amount:
    expense.amount instanceof Prisma.Decimal
      ? expense.amount.toNumber()
      : Number(expense.amount),
  startMonth: expense.startMonth.toISOString(),
  endMonth: expense.endMonth ? expense.endMonth.toISOString() : null,
  createdAt: expense.createdAt.toISOString(),
  updatedAt: expense.updatedAt.toISOString(),
});

function normalizeMonth(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid month value");
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function toDecimal(amount: number) {
  return new Prisma.Decimal(amount.toFixed(2));
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
      return NextResponse.json(
        { success: false, error: "Invalid expense payload" },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const { id: userId } = await getServerUser();

    const plan = await prisma.plan.findFirst({
      where: { id: input.planId, userId },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Plan not found for this user" },
        { status: 404 }
      );
    }

    const existing = await prisma.expense.findFirst({
      where: { id, planId: plan.id, plan: { userId } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Expense not found for this plan" },
        { status: 404 }
      );
    }

    const updated = await prisma.expense.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        category: input.category,
        amount: toDecimal(input.amount),
        frequency: input.frequency,
        startMonth: normalizeMonth(input.startMonth),
        endMonth: input.endMonth ? normalizeMonth(input.endMonth) : null,
      },
    });

    return NextResponse.json({ success: true, data: serializeExpense(updated) });
  } catch (error) {
    console.error("PUT /api/expenses/[id] error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("planId");

    if (!planId) {
      return NextResponse.json(
        { success: false, error: "planId is required" },
        { status: 400 }
      );
    }

    const { id: userId } = await getServerUser();

    const plan = await prisma.plan.findFirst({
      where: { id: planId, userId },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Plan not found for this user" },
        { status: 404 }
      );
    }

    const existing = await prisma.expense.findFirst({
      where: { id, planId: plan.id, plan: { userId } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Expense not found for this plan" },
        { status: 404 }
      );
    }

    await prisma.expense.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/expenses/[id] error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}

