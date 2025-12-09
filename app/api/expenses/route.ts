import { NextRequest, NextResponse } from "next/server";
import { ExpenseFrequency, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/serverUser";

const expenseInputSchema = z.object({
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
  frequency: z.nativeEnum(ExpenseFrequency),
  startMonth: z.string().min(1),
  endMonth: z.string().optional().nullable(),
});

const querySchema = z.object({
  planId: z.string().min(1),
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      planId: searchParams.get("planId") ?? "",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "planId is required" },
        { status: 400 }
      );
    }

    const { id: userId } = await getServerUser();

    const plan = await prisma.plan.findFirst({
      where: { id: parsed.data.planId, userId },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Plan not found for this user" },
        { status: 404 }
      );
    }

    const expenses = await prisma.expense.findMany({
      where: { planId: plan.id },
      orderBy: { startMonth: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: expenses.map(serializeExpense),
    });
  } catch (error) {
    console.error("GET /api/expenses error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = expenseInputSchema.safeParse(body);

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

    const expense = await prisma.expense.create({
      data: {
        planId: plan.id,
        name: input.name,
        category: input.category,
        amount: toDecimal(input.amount),
        frequency: input.frequency,
        startMonth: normalizeMonth(input.startMonth),
        endMonth: input.endMonth ? normalizeMonth(input.endMonth) : null,
      },
    });

    return NextResponse.json(
      { success: true, data: serializeExpense(expense) },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/expenses error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}

