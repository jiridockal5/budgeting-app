import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/serverUser";
import { DEFAULT_REVENUE_CONFIG } from "@/lib/revenueForecast";

const revenueConfigSchema = z.object({
  planId: z.string().min(1),
  config: z.object({
    plg: z.object({
      monthlyTrials: z.number().min(0),
      trialConversionRate: z.number().min(0).max(100),
      avgAcv: z.number().min(0),
      churnRate: z.number().min(0).max(100),
      expansionRate: z.number().min(0).max(100),
    }),
    sales: z.object({
      monthlySqls: z.number().min(0),
      closeRate: z.number().min(0).max(100),
      avgAcv: z.number().min(0),
      churnRate: z.number().min(0).max(100),
      expansionRate: z.number().min(0).max(100),
    }),
    partners: z.object({
      monthlyReferrals: z.number().min(0),
      closeRate: z.number().min(0).max(100),
      avgAcv: z.number().min(0),
      commissionRate: z.number().min(0).max(100),
    }),
  }),
});

const querySchema = z.object({
  planId: z.string().min(1),
});

/**
 * GET /api/revenue?planId=xxx
 * Returns the revenue stream configuration for a plan, or defaults.
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

    const plan = await prisma.plan.findFirst({
      where: { id: parsed.data.planId, userId },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Plan not found for this user" },
        { status: 404 }
      );
    }

    const scenario = await prisma.forecastScenario.findFirst({
      where: { planId: plan.id, name: "Default" },
    });

    if (!scenario || !scenario.config) {
      return NextResponse.json({
        success: true,
        data: {
          planId: plan.id,
          config: DEFAULT_REVENUE_CONFIG,
          isDefault: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        planId: plan.id,
        config: scenario.config,
        isDefault: false,
      },
    });
  } catch (error) {
    console.error("GET /api/revenue error", error);
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
 * POST /api/revenue
 * Creates or updates revenue stream configuration for a plan.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = revenueConfigSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid revenue config payload", details: parsed.error.issues },
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

    let scenario = await prisma.forecastScenario.findFirst({
      where: { planId: plan.id, name: "Default" },
    });

    if (scenario) {
      scenario = await prisma.forecastScenario.update({
        where: { id: scenario.id },
        data: { config: input.config },
      });
    } else {
      scenario = await prisma.forecastScenario.create({
        data: {
          planId: plan.id,
          name: "Default",
          startMonth: plan.startMonth,
          months: plan.months,
          config: input.config,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        planId: plan.id,
        config: scenario.config,
        isDefault: false,
      },
    });
  } catch (error) {
    console.error("POST /api/revenue error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
