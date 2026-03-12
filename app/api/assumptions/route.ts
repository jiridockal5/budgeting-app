import { NextRequest, NextResponse } from "next/server";
import { GlobalAssumptions as DbGlobalAssumptions, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/serverUser";
import { DEFAULT_ASSUMPTIONS } from "@/lib/assumptions";

// Validation schema for assumptions input
const assumptionsInputSchema = z.object({
  planId: z.string().min(1),
  cashOnHand: z.number().min(0).optional(),
  raiseMonth: z.string().regex(/^\d{4}-\d{2}$/).nullable().optional(),
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
  cac: z.number().min(0).optional(),
  baseAcv: z.number().min(0).optional(),
});

const querySchema = z.object({
  planId: z.string().min(1),
});

// Serialize Prisma Decimal values to numbers
const serializeAssumptions = (assumptions: DbGlobalAssumptions) => ({
  id: assumptions.id,
  planId: assumptions.planId,
  cashOnHand: assumptions.cashOnHand instanceof Prisma.Decimal
    ? assumptions.cashOnHand.toNumber()
    : Number(assumptions.cashOnHand ?? 0),
  raiseMonth: assumptions.raiseMonth ?? null,
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
  cac: assumptions.cac instanceof Prisma.Decimal
    ? assumptions.cac.toNumber()
    : Number(assumptions.cac ?? 0),
  baseAcv: assumptions.baseAcv instanceof Prisma.Decimal
    ? assumptions.baseAcv.toNumber()
    : Number(assumptions.baseAcv ?? 0),
  createdAt: assumptions.createdAt.toISOString(),
  updatedAt: assumptions.updatedAt.toISOString(),
});

/**
 * GET /api/assumptions?planId=xxx
 * Fetches assumptions for a plan, or returns defaults if none exist
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

    // Verify plan belongs to user
    const plan = await prisma.plan.findFirst({
      where: { id: parsed.data.planId, userId },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Plan not found for this user" },
        { status: 404 }
      );
    }

    // Fetch assumptions for this plan
    const assumptions = await prisma.globalAssumptions.findUnique({
      where: { planId: plan.id },
    });

    if (!assumptions) {
      // Return defaults if no assumptions saved yet
      return NextResponse.json({
        success: true,
        data: {
          planId: plan.id,
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
    console.error("GET /api/assumptions error", error);
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
 * POST /api/assumptions
 * Creates or updates assumptions for a plan (upsert)
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
    const { id: userId } = await getServerUser();

    // Verify plan belongs to user
    const plan = await prisma.plan.findFirst({
      where: { id: input.planId, userId },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Plan not found for this user" },
        { status: 404 }
      );
    }

    // Upsert assumptions (create if not exists, update if exists)
    const assumptions = await prisma.globalAssumptions.upsert({
      where: { planId: plan.id },
      create: {
        planId: plan.id,
        cashOnHand: input.cashOnHand ?? 0,
        raiseMonth: input.raiseMonth ?? null,
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
        cac: input.cac ?? 0,
        baseAcv: input.baseAcv ?? 0,
      },
      update: {
        cashOnHand: input.cashOnHand ?? undefined,
        raiseMonth: input.raiseMonth ?? undefined,
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
        cac: input.cac ?? undefined,
        baseAcv: input.baseAcv ?? undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: serializeAssumptions(assumptions),
    });
  } catch (error) {
    console.error("POST /api/assumptions error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
