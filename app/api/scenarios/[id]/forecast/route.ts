import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

type RouteParams = {
  params: Promise<{ id: string }>;
};

function toNumber(value: unknown): number {
  if (value instanceof Prisma.Decimal) return value.toNumber();
  return Number(value);
}

function mapFrequency(
  dbFreq: "MONTHLY" | "ONE_TIME" | "YEARLY"
): "monthly" | "annual" | "one_time" {
  switch (dbFreq) {
    case "MONTHLY": return "monthly";
    case "YEARLY": return "annual";
    case "ONE_TIME": return "one_time";
  }
}

export async function GET(_request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const { id: userId } = await getServerUser();

    const scenario = await prisma.forecastScenario.findFirst({
      where: { id },
      include: {
        plan: {
          include: {
            assumptions: true,
            people: true,
            expenses: true,
          },
        },
      },
    });

    if (!scenario || scenario.plan.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Scenario not found" },
        { status: 404 }
      );
    }

    const plan = scenario.plan;
    const dbAssumptions = plan.assumptions;

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

    const revenueConfig: RevenueConfig = scenario.config
      ? (scenario.config as unknown as RevenueConfig)
      : DEFAULT_REVENUE_CONFIG;

    const expenseInput: ExpenseInput = {
      headcount: plan.people.map((p) => ({
        role: p.role,
        category: p.category,
        baseSalary: p.salary,
        fte: p.fte,
        startMonth: p.startDate
          ? dateToMonth(p.startDate)
          : dateToMonth(plan.startMonth),
      })),
      nonHeadcount: plan.expenses.map((e) => ({
        name: e.name,
        category: e.category,
        amount: toNumber(e.amount),
        frequency: mapFrequency(e.frequency),
        startMonth: dateToMonth(e.startMonth),
        endMonth: e.endMonth ? dateToMonth(e.endMonth) : undefined,
      })),
    };

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
      data: { scenarioId: scenario.id, scenarioName: scenario.name, ...result },
    });
  } catch (error) {
    console.error("GET /api/scenarios/[id]/forecast error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
