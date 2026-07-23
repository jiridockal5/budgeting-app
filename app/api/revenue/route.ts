import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { DEFAULT_REVENUE_CONFIG, isBlankRevenueConfig } from "@/lib/revenueForecast";
import type { RevenueConfig } from "@/lib/revenueForecast";
import { captureRouteException } from "@/lib/monitoring";
import { getScopedScenario } from "@/lib/server/planScope";

const revenueConfigSchema = z.object({
  planId: z.string().min(1),
  scenarioId: z.string().min(1),
  config: z.object({
    plg: z.object({
      monthlyTrials: z.number().min(0),
      trialConversionRate: z.number().min(0).max(100),
      avgAcv: z.number().min(0),
      monthlyDealShare: z.number().min(0).max(100).optional(),
      monthlyArpa: z.number().min(0).optional(),
      churnRate: z.number().min(0).max(100),
      expansionRate: z.number().min(0).max(100),
    }),
    sales: z.object({
      monthlySqls: z.number().min(0),
      closeRate: z.number().min(0).max(100),
      avgAcv: z.number().min(0),
      monthlyDealShare: z.number().min(0).max(100).optional(),
      monthlyArpa: z.number().min(0).optional(),
      churnRate: z.number().min(0).max(100),
      expansionRate: z.number().min(0).max(100),
    }),
    partners: z.object({
      monthlyReferrals: z.number().min(0),
      closeRate: z.number().min(0).max(100),
      avgAcv: z.number().min(0),
      monthlyDealShare: z.number().min(0).max(100).optional(),
      monthlyArpa: z.number().min(0).optional(),
      commissionRate: z.number().min(0).max(100),
    }),
  }),
});

const querySchema = z.object({
  planId: z.string().min(1),
  scenarioId: z.string().min(1),
});

/**
 * GET /api/revenue?planId=xxx&scenarioId=xxx
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

    if (!scoped.scenario.config) {
      return NextResponse.json({
        success: true,
        data: {
          planId: scoped.plan.id,
          scenarioId: scoped.scenario.id,
          config: DEFAULT_REVENUE_CONFIG,
          isDefault: true,
        },
      });
    }

    const config = scoped.scenario.config as unknown as RevenueConfig;
    return NextResponse.json({
      success: true,
      data: {
        planId: scoped.plan.id,
        scenarioId: scoped.scenario.id,
        config,
        isDefault: isBlankRevenueConfig(config),
      },
    });
  } catch (error) {
    captureRouteException("GET /api/revenue", error);
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
 * POST /api/revenue — update revenue config for any scenario
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
    const scoped = await getScopedScenario(input.scenarioId);
    if (!scoped.ok) return scoped.response;
    if (scoped.plan.id !== input.planId) {
      return NextResponse.json(
        { success: false, error: "Scenario does not belong to this plan" },
        { status: 404 }
      );
    }

    const scenario = await prisma.forecastScenario.update({
      where: { id: scoped.scenario.id },
      data: { config: input.config },
    });

    return NextResponse.json({
      success: true,
      data: {
        planId: scoped.plan.id,
        scenarioId: scenario.id,
        config: scenario.config,
        isDefault: false,
      },
    });
  } catch (error) {
    captureRouteException("POST /api/revenue", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
