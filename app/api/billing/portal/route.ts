import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/serverUser";

export async function POST(request: NextRequest) {
  try {
    const { id: userId } = await getServerUser();

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

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      returnUrl: `${origin}/app/settings/billing`,
    });

    return NextResponse.json({
      success: true,
      data: { url: session.url },
    });
  } catch (error) {
    console.error("POST /api/billing/portal error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
