import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveDbUser } from "@/lib/server/dbUser";
import { requireAppAccess } from "@/lib/requireAppAccess";
import { checkScenarioLimit } from "@/lib/planGating";
import { captureRouteException } from "@/lib/monitoring";
import {
  cloneScenarioInputs,
  seedFreshScenarioInputs,
} from "@/lib/server/scenarioClone";
import { DEFAULT_REVENUE_CONFIG } from "@/lib/revenueForecast";
import { ensureDefaultScenario } from "@/lib/server/planScope";

const createSchema = z.object({
  planId: z.string().min(1),
  name: z.string().min(1).max(100),
  mode: z.enum(["copy", "fresh"]).default("fresh"),
  sourceScenarioId: z.string().optional(),
  /** @deprecated — ignored; use mode/sourceScenarioId */
  config: z.record(z.string(), z.unknown()).optional(),
});

const querySchema = z.object({
  planId: z.string().min(1),
});

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

    const user = await resolveDbUser();
    const denied = await requireAppAccess(user.id);
    if (denied) return denied;

    const plan = await prisma.plan.findFirst({
      where: { id: parsed.data.planId, userId: user.id },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Plan not found" },
        { status: 404 }
      );
    }

    await ensureDefaultScenario(plan);

    const scenarios = await prisma.forecastScenario.findMany({
      where: { planId: plan.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        config: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: scenarios });
  } catch (error) {
    captureRouteException("GET /api/scenarios", error);
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
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid scenario payload", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const user = await resolveDbUser();
    const denied = await requireAppAccess(user.id);
    if (denied) return denied;

    const plan = await prisma.plan.findFirst({
      where: { id: input.planId, userId: user.id },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Plan not found" },
        { status: 404 }
      );
    }

    const scenarioLimit = await checkScenarioLimit(user.id, plan.id);
    if (!scenarioLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Subscription required. Your trial has ended.",
          upgrade: true,
        },
        { status: 403 }
      );
    }

    if (input.mode === "copy") {
      if (!input.sourceScenarioId) {
        return NextResponse.json(
          { success: false, error: "sourceScenarioId is required when mode is copy" },
          { status: 400 }
        );
      }
      const source = await prisma.forecastScenario.findFirst({
        where: { id: input.sourceScenarioId, planId: plan.id },
      });
      if (!source) {
        return NextResponse.json(
          { success: false, error: "Source scenario not found" },
          { status: 404 }
        );
      }

      const scenario = await prisma.forecastScenario.create({
        data: {
          planId: plan.id,
          name: input.name,
          startMonth: plan.startMonth,
          months: plan.months,
          config: (source.config ??
            DEFAULT_REVENUE_CONFIG) as Prisma.InputJsonValue,
        },
      });

      await cloneScenarioInputs(source.id, scenario.id, plan.id);

      return NextResponse.json(
        { success: true, data: scenario },
        { status: 201 }
      );
    }

    // fresh — blank starter (no assumptions row, null revenue, empty costs)
    const scenario = await prisma.forecastScenario.create({
      data: {
        planId: plan.id,
        name: input.name,
        startMonth: plan.startMonth,
        months: plan.months,
        config: Prisma.DbNull,
      },
    });

    await seedFreshScenarioInputs(scenario.id);

    return NextResponse.json(
      { success: true, data: scenario },
      { status: 201 }
    );
  } catch (error) {
    captureRouteException("POST /api/scenarios", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
