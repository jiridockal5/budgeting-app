import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/serverUser";
import { resolveDbUser } from "@/lib/server/dbUser";
import { requireAppAccess } from "@/lib/requireAppAccess";
import { getUserAccessInfo } from "@/lib/planGating";
import { captureRouteException } from "@/lib/monitoring";

const patchSchema = z.object({
  months: z.number().int().min(1).max(120).optional(),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/, "Expected YYYY-MM format").optional(),
});

/**
 * GET /api/plans/current
 * Gets the user's current (first) plan, or creates a default one if none exists
 */
export async function GET() {
  try {
    const { email } = await getServerUser();
    const user = await resolveDbUser();

    // Find the user's first plan
    let plan = await prisma.plan.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    // If no plan exists, create a default one
    if (!plan) {
      const denied = await requireAppAccess(user.id);
      if (denied) return denied;

      plan = await prisma.plan.create({
        data: {
          userId: user.id,
          name: "My First Plan",
          currency: "EUR",
          startMonth: new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 1)),
          months: 24,
        },
      });
    }

    const access = await getUserAccessInfo(user.id, email);
    if (!access.hasAppAccess) {
      const denied = await requireAppAccess(user.id);
      if (denied) return denied;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: plan.id,
        name: plan.name,
        currency: plan.currency,
        startMonth: plan.startMonth.toISOString(),
        months: plan.months,
        accessState: access.state,
        tier: access.state === "locked" ? "locked" : "growth",
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    captureRouteException("GET /api/plans/current", error);
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
 * PATCH /api/plans/current
 * Updates the user's current plan settings (months, startMonth)
 */
export async function PATCH(request: NextRequest) {
  try {
    const { email } = await getServerUser();
    const user = await resolveDbUser();

    const denied = await requireAppAccess(user.id);
    if (denied) return denied;

    const plan = await prisma.plan.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Plan not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const updates: { months?: number; startMonth?: Date } = {};

    if (parsed.data.months !== undefined) {
      updates.months = parsed.data.months;
    }

    if (parsed.data.startMonth !== undefined) {
      const [year, month] = parsed.data.startMonth.split("-").map(Number);
      updates.startMonth = new Date(Date.UTC(year, month - 1, 1));
    }

    const updated = await prisma.plan.update({
      where: { id: plan.id },
      data: updates,
    });

    const access = await getUserAccessInfo(user.id, email);

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        currency: updated.currency,
        startMonth: updated.startMonth.toISOString(),
        months: updated.months,
        accessState: access.state,
        tier: access.state === "locked" ? "locked" : "growth",
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    captureRouteException("PATCH /api/plans/current", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
