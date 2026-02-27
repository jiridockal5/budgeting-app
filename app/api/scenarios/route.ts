import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/serverUser";
import { checkScenarioLimit } from "@/lib/planGating";

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

    const { id: userId } = await getServerUser();

    const plan = await prisma.plan.findFirst({
      where: { id: parsed.data.planId, userId },
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
    console.error("GET /api/scenarios error", error);
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
    const { id: userId } = await getServerUser();

    const plan = await prisma.plan.findFirst({
      where: { id: input.planId, userId },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Plan not found" },
        { status: 404 }
      );
    }

    const scenarioLimit = await checkScenarioLimit(userId, plan.id);
    if (!scenarioLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Scenario limit reached (${scenarioLimit.currentCount}/${scenarioLimit.maxAllowed}). ${
            scenarioLimit.tier === "free"
              ? "Upgrade to Growth for more scenarios."
              : "Maximum scenarios reached."
          }`,
          upgrade: scenarioLimit.tier === "free",
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
    console.error("POST /api/scenarios error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
