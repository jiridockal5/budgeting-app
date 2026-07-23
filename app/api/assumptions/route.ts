import { NextRequest, NextResponse } from "next/server";
import { GlobalAssumptions as DbGlobalAssumptions, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ASSUMPTIONS } from "@/lib/assumptions";
import { captureRouteException } from "@/lib/monitoring";
import { getScopedScenario } from "@/lib/server/planScope";

const assumptionsInputSchema = z.object({
  planId: z.string().min(1),
  scenarioId: z.string().min(1),
  cashOnHand: z.number().min(0).optional(),
  plannedRaiseMonth: z.string().regex(/^\d{4}-\d{2}$/).nullable().optional(),
  plannedRaiseAmount: z.number().min(0).nullable().optional(),
  fundraisingFees: z.number().min(0).max(100),
  minCashBuffer: z.number().min(0).nullable().optional(),
  targetRunwayMonths: z.number().int().min(0).nullable().optional(),
  churnRate: z.number().min(0).max(100),
  expansionRate: z.number().min(0).max(100),
  paymentTimingDays: z.number().int().min(0),
  priceUplift: z.number().min(0).max(100).nullable().optional(),
  salaryTaxRate: z.number().min(0).max(100),
  salaryGrowthRate: z.number().min(0).max(100),
  commissionRate: z.number().min(0).max(100),
  inflationRate: z.number().min(0).max(100),
  baseAcv: z.number().min(0).optional(),
});

const querySchema = z.object({
  planId: z.string().min(1),
  scenarioId: z.string().min(1),
});

const serializeAssumptions = (assumptions: DbGlobalAssumptions) => ({
  id: assumptions.id,
  planId: assumptions.planId,
  scenarioId: assumptions.scenarioId,
  cashOnHand: assumptions.cashOnHand instanceof Prisma.Decimal
    ? assumptions.cashOnHand.toNumber()
    : Number(assumptions.cashOnHand ?? 0),
  plannedRaiseMonth: assumptions.plannedRaiseMonth ?? null,
  plannedRaiseAmount: assumptions.plannedRaiseAmount == null
    ? null
    : assumptions.plannedRaiseAmount instanceof Prisma.Decimal
      ? assumptions.plannedRaiseAmount.toNumber()
      : Number(assumptions.plannedRaiseAmount),
  fundraisingFees: assumptions.fundraisingFees instanceof Prisma.Decimal
    ? assumptions.fundraisingFees.toNumber()
    : Number(assumptions.fundraisingFees ?? 0),
  minCashBuffer: assumptions.minCashBuffer == null
    ? null
    : assumptions.minCashBuffer instanceof Prisma.Decimal
      ? assumptions.minCashBuffer.toNumber()
      : Number(assumptions.minCashBuffer),
  targetRunwayMonths:
    assumptions.targetRunwayMonths == null
      ? null
      : Number(assumptions.targetRunwayMonths),
  churnRate: assumptions.churnRate instanceof Prisma.Decimal
    ? assumptions.churnRate.toNumber()
    : Number(assumptions.churnRate),
  expansionRate: assumptions.expansionRate instanceof Prisma.Decimal
    ? assumptions.expansionRate.toNumber()
    : Number(assumptions.expansionRate),
  paymentTimingDays: Number(assumptions.paymentTimingDays ?? 0),
  priceUplift: assumptions.priceUplift == null
    ? null
    : assumptions.priceUplift instanceof Prisma.Decimal
      ? assumptions.priceUplift.toNumber()
      : Number(assumptions.priceUplift),
  salaryTaxRate: assumptions.salaryTaxRate instanceof Prisma.Decimal
    ? assumptions.salaryTaxRate.toNumber()
    : Number(assumptions.salaryTaxRate),
  salaryGrowthRate: assumptions.salaryGrowthRate instanceof Prisma.Decimal
    ? assumptions.salaryGrowthRate.toNumber()
    : Number(assumptions.salaryGrowthRate),
  commissionRate: assumptions.commissionRate instanceof Prisma.Decimal
    ? assumptions.commissionRate.toNumber()
    : Number(assumptions.commissionRate ?? 0),
  inflationRate: assumptions.inflationRate instanceof Prisma.Decimal
    ? assumptions.inflationRate.toNumber()
    : Number(assumptions.inflationRate),
  baseAcv: assumptions.baseAcv instanceof Prisma.Decimal
    ? assumptions.baseAcv.toNumber()
    : Number(assumptions.baseAcv ?? 0),
  createdAt: assumptions.createdAt.toISOString(),
  updatedAt: assumptions.updatedAt.toISOString(),
});

/**
 * GET /api/assumptions?planId=xxx&scenarioId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      planId: searchParams.get("planId") ?? "",
      scenarioId: searchParams.get("scenarioId") ?? "",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "planId and scenarioId are required" },
        { status: 400 }
      );
    }

    const scoped = await getScopedScenario(parsed.data.scenarioId);
    if (!scoped.ok) return scoped.response;
    if (scoped.plan.id !== parsed.data.planId) {
      return NextResponse.json(
        { success: false, error: "Scenario does not belong to this plan" },
        { status: 404 }
      );
    }

    const assumptions = await prisma.globalAssumptions.findUnique({
      where: { scenarioId: scoped.scenario.id },
    });

    if (!assumptions) {
      return NextResponse.json({
        success: true,
        data: {
          planId: scoped.plan.id,
          scenarioId: scoped.scenario.id,
          ...DEFAULT_ASSUMPTIONS,
          isDefault: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...serializeAssumptions(assumptions),
        isDefault: false,
      },
    });
  } catch (error) {
    captureRouteException("GET /api/assumptions", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/assumptions — upsert for a scenario
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = assumptionsInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid assumptions payload", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const scoped = await getScopedScenario(input.scenarioId);
    if (!scoped.ok) return scoped.response;
    if (scoped.plan.id !== input.planId) {
      return NextResponse.json(
        { success: false, error: "Scenario does not belong to this plan" },
        { status: 404 }
      );
    }

    const assumptions = await prisma.globalAssumptions.upsert({
      where: { scenarioId: scoped.scenario.id },
      create: {
        planId: scoped.plan.id,
        scenarioId: scoped.scenario.id,
        cashOnHand: input.cashOnHand ?? 0,
        plannedRaiseMonth: input.plannedRaiseMonth ?? null,
        plannedRaiseAmount: input.plannedRaiseAmount ?? null,
        fundraisingFees: input.fundraisingFees,
        minCashBuffer: input.minCashBuffer ?? null,
        targetRunwayMonths: input.targetRunwayMonths ?? null,
        churnRate: input.churnRate,
        expansionRate: input.expansionRate,
        paymentTimingDays: input.paymentTimingDays,
        priceUplift: input.priceUplift ?? null,
        salaryTaxRate: input.salaryTaxRate,
        salaryGrowthRate: input.salaryGrowthRate,
        commissionRate: input.commissionRate,
        inflationRate: input.inflationRate,
        baseAcv: input.baseAcv ?? 0,
      },
      update: {
        cashOnHand: input.cashOnHand ?? undefined,
        plannedRaiseMonth: input.plannedRaiseMonth ?? undefined,
        plannedRaiseAmount:
          input.plannedRaiseAmount === undefined ? undefined : input.plannedRaiseAmount,
        fundraisingFees: input.fundraisingFees,
        minCashBuffer: input.minCashBuffer === undefined ? undefined : input.minCashBuffer,
        targetRunwayMonths:
          input.targetRunwayMonths === undefined ? undefined : input.targetRunwayMonths,
        churnRate: input.churnRate,
        expansionRate: input.expansionRate,
        paymentTimingDays: input.paymentTimingDays,
        priceUplift: input.priceUplift === undefined ? undefined : input.priceUplift,
        salaryTaxRate: input.salaryTaxRate,
        salaryGrowthRate: input.salaryGrowthRate,
        commissionRate: input.commissionRate,
        inflationRate: input.inflationRate,
        baseAcv: input.baseAcv ?? undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: serializeAssumptions(assumptions),
    });
  } catch (error) {
    captureRouteException("POST /api/assumptions", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
