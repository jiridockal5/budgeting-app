import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ASSUMPTIONS } from "@/lib/assumptions";
import { captureRouteException } from "@/lib/monitoring";
import {
  buildForecast,
  dateToMonth,
  DEFAULT_REVENUE_CONFIG,
  type RevenueConfig,
  type ExpenseInput,
  type AssumptionsInput,
} from "@/lib/revenueForecast";
import { parseCostModel } from "@/lib/expenses";
import {
  ensureDefaultScenario,
  getScopedPlan,
  getScopedScenario,
} from "@/lib/server/planScope";

const querySchema = z.object({
  planId: z.string().min(1),
  scenarioId: z.string().optional(),
});

/**
 * GET /api/forecast?planId=xxx&scenarioId=xxx
 * scenarioId optional — defaults to the plan's Default scenario.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      planId: searchParams.get("planId") ?? "",
      scenarioId: searchParams.get("scenarioId") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "planId is required" },
        { status: 400 }
      );
    }

    let plan;
    let scenario;

    if (parsed.data.scenarioId) {
      const scoped = await getScopedScenario(parsed.data.scenarioId);
      if (!scoped.ok) return scoped.response;
      if (scoped.plan.id !== parsed.data.planId) {
        return NextResponse.json(
          { success: false, error: "Scenario does not belong to this plan" },
          { status: 404 }
        );
      }
      plan = scoped.plan;
      scenario = scoped.scenario;
    } else {
      const scoped = await getScopedPlan(parsed.data.planId);
      if (!scoped.ok) return scoped.response;
      plan = scoped.plan;
      scenario = await ensureDefaultScenario(plan);
    }

    const [dbAssumptions, dbPeople, dbExpenses] = await Promise.all([
      prisma.globalAssumptions.findUnique({ where: { scenarioId: scenario.id } }),
      prisma.person.findMany({ where: { scenarioId: scenario.id } }),
      prisma.expense.findMany({ where: { scenarioId: scenario.id } }),
    ]);

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
      headcount: dbPeople.map((p) => ({
        role: p.role,
        type: p.type,
        category: p.category,
        baseSalary: p.salary,
        fte: p.fte,
        startMonth: p.startDate ? dateToMonth(p.startDate) : dateToMonth(plan.startMonth),
        endMonth: p.endDate ? dateToMonth(p.endDate) : undefined,
      })),
      nonHeadcount: dbExpenses.map((e) => ({
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
      data: { ...result, scenarioId: scenario.id, scenarioName: scenario.name },
    });
  } catch (error) {
    captureRouteException("GET /api/forecast", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}

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
