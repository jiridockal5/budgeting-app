import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/serverUser";
import { DEFAULT_ASSUMPTIONS } from "@/lib/assumptions";

// Validation schema for assumptions input
const assumptionsInputSchema = z.object({
  planId: z.string().min(1),
  cac: z.number().min(0),
  churnRate: z.number().min(0).max(100),
  expansionRate: z.number().min(0).max(100),
  baseAcv: z.number().min(0),
  salaryTaxRate: z.number().min(0).max(100),
  salaryGrowthRate: z.number().min(0).max(100),
  inflationRate: z.number().min(0).max(100),
});

const querySchema = z.object({
  planId: z.string().min(1),
});

// Serialize Prisma Decimal values to numbers
const serializeAssumptions = (assumptions: any) => ({
  id: assumptions.id,
  planId: assumptions.planId,
  cac: assumptions.cac instanceof Prisma.Decimal
    ? assumptions.cac.toNumber()
    : Number(assumptions.cac),
  churnRate: assumptions.churnRate instanceof Prisma.Decimal
    ? assumptions.churnRate.toNumber()
    : Number(assumptions.churnRate),
  expansionRate: assumptions.expansionRate instanceof Prisma.Decimal
    ? assumptions.expansionRate.toNumber()
    : Number(assumptions.expansionRate),
  baseAcv: assumptions.baseAcv instanceof Prisma.Decimal
    ? assumptions.baseAcv.toNumber()
    : Number(assumptions.baseAcv),
  salaryTaxRate: assumptions.salaryTaxRate instanceof Prisma.Decimal
    ? assumptions.salaryTaxRate.toNumber()
    : Number(assumptions.salaryTaxRate),
  salaryGrowthRate: assumptions.salaryGrowthRate instanceof Prisma.Decimal
    ? assumptions.salaryGrowthRate.toNumber()
    : Number(assumptions.salaryGrowthRate),
  inflationRate: assumptions.inflationRate instanceof Prisma.Decimal
    ? assumptions.inflationRate.toNumber()
    : Number(assumptions.inflationRate),
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
        cac: input.cac,
        churnRate: input.churnRate,
        expansionRate: input.expansionRate,
        baseAcv: input.baseAcv,
        salaryTaxRate: input.salaryTaxRate,
        salaryGrowthRate: input.salaryGrowthRate,
        inflationRate: input.inflationRate,
      },
      update: {
        cac: input.cac,
        churnRate: input.churnRate,
        expansionRate: input.expansionRate,
        baseAcv: input.baseAcv,
        salaryTaxRate: input.salaryTaxRate,
        salaryGrowthRate: input.salaryGrowthRate,
        inflationRate: input.inflationRate,
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
