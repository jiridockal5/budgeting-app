import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/serverUser";
import { getUserTier } from "@/lib/planGating";

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
