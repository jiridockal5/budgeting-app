import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/serverUser";
import { getUserAccessInfo } from "@/lib/planGating";
import { captureRouteException } from "@/lib/monitoring";

export async function GET() {
  try {
    const { id: userId } = await getServerUser();

    const user = await prisma.user.findFirst({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const access = await getUserAccessInfo(userId);
    const sub = user.subscription;

    return NextResponse.json({
      success: true,
      data: {
        ...access,
        subscription: sub
          ? {
              id: sub.id,
              status: sub.status,
              currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
              cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            }
          : null,
        hasStripeAccount: !!user.stripeCustomerId,
      },
    });
  } catch (error) {
    captureRouteException("GET /api/billing/status", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
