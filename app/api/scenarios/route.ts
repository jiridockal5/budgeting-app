import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveDbUser } from "@/lib/server/dbUser";
import { requireAppAccess } from "@/lib/requireAppAccess";
import { checkScenarioLimit } from "@/lib/planGating";
import { captureRouteException } from "@/lib/monitoring";

const createSchema = z.object({
  planId: z.string().min(1),
  name: z.string().min(1).max(100),
  config: z.record(z.string(), z.unknown()),
  sourceScenarioId: z.string().optional(),
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

    const scenario = await prisma.forecastScenario.create({
      data: {
        planId: plan.id,
        name: input.name,
        startMonth: plan.startMonth,
        months: plan.months,
        config: input.config as Prisma.InputJsonValue,
      },
    });

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
