import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/serverUser";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    const { id: userId } = await getServerUser();

    const scenario = await prisma.forecastScenario.findFirst({
      where: { id },
      include: { plan: { select: { userId: true } } },
    });

    if (!scenario || scenario.plan.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Scenario not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.forecastScenario.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/scenarios/[id] error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const { id: userId } = await getServerUser();

    const scenario = await prisma.forecastScenario.findFirst({
      where: { id },
      include: { plan: { select: { userId: true } } },
    });

    if (!scenario || scenario.plan.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Scenario not found" },
        { status: 404 }
      );
    }

    if (scenario.name === "Default") {
      return NextResponse.json(
        { success: false, error: "Cannot delete the default scenario" },
        { status: 400 }
      );
    }

    await prisma.forecastScenario.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/scenarios/[id] error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
