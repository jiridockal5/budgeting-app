import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/serverUser";
import { checkRateLimit } from "@/lib/apiUtils";
import { captureRouteException } from "@/lib/monitoring";

export async function POST(request: NextRequest) {
  try {
    const { id: userId } = await getServerUser();

    if (!checkRateLimit(`billing-portal:${userId}`, 10, 60_000)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again shortly." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { id: userId },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { success: false, error: "No billing account found" },
        { status: 404 }
      );
    }

    const origin = request.headers.get("origin") ?? "http://localhost:3001";

    const session = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/app/settings/billing`,
    });

    return NextResponse.json({
      success: true,
      data: { url: session.url },
    });
  } catch (error) {
    captureRouteException("POST /api/billing/portal", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
