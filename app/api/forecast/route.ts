import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/serverUser";
import { DEFAULT_ASSUMPTIONS } from "@/lib/assumptions";
import {
  buildForecast,
  dateToMonth,
  DEFAULT_REVENUE_CONFIG,
  type RevenueConfig,
  type ExpenseInput,
  type AssumptionsInput,
} from "@/lib/revenueForecast";

const querySchema = z.object({
  planId: z.string().min(1),
});

/**
 * GET /api/forecast?planId=xxx
 *
 * Computes a full financial forecast by pulling all plan data from the DB
 * and running the forecast engine.
 */
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

    // 1. Fetch plan
    const plan = await prisma.plan.findFirst({
      where: { id: parsed.data.planId, userId },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Plan not found for this user" },
        { status: 404 }
      );
    }

    // 2. Fetch all related data in parallel
    const [dbAssumptions, dbPeople, dbExpenses, dbScenario] = await Promise.all(
      [
        prisma.globalAssumptions.findUnique({ where: { planId: plan.id } }),
        prisma.person.findMany({ where: { planId: plan.id } }),
        prisma.expense.findMany({ where: { planId: plan.id } }),
        prisma.forecastScenario.findFirst({ where: { planId: plan.id, name: "Default" } }),
      ]
    );

    // 3. Build assumptions input
    const assumptions: AssumptionsInput = dbAssumptions
      ? {
          cashOnHand: toNumber((dbAssumptions as any).cashOnHand ?? 0),
          cac: toNumber(dbAssumptions.cac),
          churnRate: toNumber(dbAssumptions.churnRate),
          expansionRate: toNumber(dbAssumptions.expansionRate),
          baseAcv: toNumber(dbAssumptions.baseAcv),
          salaryTaxRate: toNumber(dbAssumptions.salaryTaxRate),
          salaryGrowthRate: toNumber(dbAssumptions.salaryGrowthRate),
          inflationRate: toNumber(dbAssumptions.inflationRate),
        }
      : DEFAULT_ASSUMPTIONS;

    // 4. Build revenue config
    const revenueConfig: RevenueConfig =
      dbScenario?.config
        ? (dbScenario.config as unknown as RevenueConfig)
        : DEFAULT_REVENUE_CONFIG;

    // 5. Build expense inputs
    const expenseInput: ExpenseInput = {
      headcount: dbPeople.map((p) => ({
        role: p.role,
        category: p.category,
        baseSalary: p.salary,
        fte: p.fte,
        startMonth: p.startDate ? dateToMonth(p.startDate) : dateToMonth(plan.startMonth),
      })),
      nonHeadcount: dbExpenses.map((e) => ({
        name: e.name,
        category: e.category,
        amount: toNumber(e.amount),
        frequency: mapFrequency(e.frequency),
        startMonth: dateToMonth(e.startMonth),
        endMonth: e.endMonth ? dateToMonth(e.endMonth) : undefined,
      })),
    };

    // 6. Run forecast
    const startMonth = dateToMonth(plan.startMonth);
    const result = buildForecast(
      plan.months,
      startMonth,
      revenueConfig,
      expenseInput,
      assumptions
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("GET /api/forecast error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}

// ── Helpers ──

function toNumber(value: unknown): number {
  if (value instanceof Prisma.Decimal) return value.toNumber();
  return Number(value);
}

function mapFrequency(
  dbFreq: "MONTHLY" | "ONE_TIME" | "YEARLY"
): "monthly" | "annual" | "one_time" {
  switch (dbFreq) {
    case "MONTHLY":
      return "monthly";
    case "YEARLY":
      return "annual";
    case "ONE_TIME":
      return "one_time";
  }
}
