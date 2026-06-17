import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveDbUser } from "@/lib/server/dbUser";
import { requireAppAccess } from "@/lib/requireAppAccess";
import { captureRouteException } from "@/lib/monitoring";
import { DEFAULT_ASSUMPTIONS } from "@/lib/assumptions";
import {
  buildForecast,
  dateToMonth,
  DEFAULT_REVENUE_CONFIG,
  type RevenueConfig,
  type ExpenseInput,
  type AssumptionsInput,
} from "@/lib/revenueForecast";
import { parseCostModel } from "@/lib/expenses";

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
    const user = await resolveDbUser();
    const denied = await requireAppAccess(user.id);
    if (denied) return denied;

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

    if (!scenario || scenario.plan.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Scenario not found" },
        { status: 404 }
      );
    }

    const plan = scenario.plan;
    const dbAssumptions = plan.assumptions;

    const assumptions: AssumptionsInput = dbAssumptions
      ? {
          cashOnHand: toNumber(dbAssumptions.cashOnHand ?? 0),
          plannedRaiseMonth: dbAssumptions.plannedRaiseMonth ?? null,
          plannedRaiseAmount:
            dbAssumptions.plannedRaiseAmount == null
              ? null
              : toNumber(dbAssumptions.plannedRaiseAmount),
          fundraisingFees: toNumber(dbAssumptions.fundraisingFees ?? 0),
          minCashBuffer:
            dbAssumptions.minCashBuffer == null
              ? null
              : toNumber(dbAssumptions.minCashBuffer),
          targetRunwayMonths:
            dbAssumptions.targetRunwayMonths == null
              ? null
              : Number(dbAssumptions.targetRunwayMonths),
          churnRate: toNumber(dbAssumptions.churnRate),
          expansionRate: toNumber(dbAssumptions.expansionRate),
          paymentTimingDays: Number(dbAssumptions.paymentTimingDays ?? 30),
          priceUplift:
            dbAssumptions.priceUplift == null
              ? null
              : toNumber(dbAssumptions.priceUplift),
          baseAcv: toNumber(dbAssumptions.baseAcv ?? 0),
          salaryTaxRate: toNumber(dbAssumptions.salaryTaxRate),
          salaryGrowthRate: toNumber(dbAssumptions.salaryGrowthRate),
          commissionRate: toNumber(dbAssumptions.commissionRate ?? 0),
          inflationRate: toNumber(dbAssumptions.inflationRate),
        }
      : DEFAULT_ASSUMPTIONS;

    const revenueConfig: RevenueConfig = scenario.config
      ? (scenario.config as unknown as RevenueConfig)
      : DEFAULT_REVENUE_CONFIG;

    const expenseInput: ExpenseInput = {
      headcount: plan.people.map((p) => ({
        role: p.role,
        type: p.type,
        category: p.category,
        baseSalary: p.salary,
        fte: p.fte,
        startMonth: p.startDate
          ? dateToMonth(p.startDate)
          : dateToMonth(plan.startMonth),
        endMonth: p.endDate ? dateToMonth(p.endDate) : undefined,
      })),
      nonHeadcount: plan.expenses.map((e) => ({
        name: e.name,
        category: e.category,
        amount: toNumber(e.amount),
        frequency: mapFrequency(e.frequency),
        startMonth: dateToMonth(e.startMonth),
        endMonth: e.endMonth ? dateToMonth(e.endMonth) : undefined,
        config: parseCostModel(e.config),
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
    captureRouteException("GET /api/scenarios/[id]/forecast", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
