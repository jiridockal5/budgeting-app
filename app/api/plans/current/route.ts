import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/serverUser";
import { getUserTier } from "@/lib/planGating";

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
    const { id: supabaseUserId, email } = await getServerUser();

    // First, ensure we have a user in our database that matches the Supabase user
    let user = await prisma.user.findFirst({
      where: { email: email ?? undefined },
    });

    // If no user exists, create one
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: supabaseUserId,
          email: email ?? "unknown@example.com",
          name: email?.split("@")[0] ?? "User",
        },
      });
    }

    // Find the user's first plan
    let plan = await prisma.plan.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    // If no plan exists, create a default one
    if (!plan) {
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

    const tier = await getUserTier(user.id);

    return NextResponse.json({
      success: true,
      data: {
        id: plan.id,
        name: plan.name,
        currency: plan.currency,
        startMonth: plan.startMonth.toISOString(),
        months: plan.months,
        tier,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("GET /api/plans/current error", error);
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

    const user = await prisma.user.findFirst({
      where: { email: email ?? undefined },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

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

    const tier = await getUserTier(user.id);

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        currency: updated.currency,
        startMonth: updated.startMonth.toISOString(),
        months: updated.months,
        tier,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("PATCH /api/plans/current error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
