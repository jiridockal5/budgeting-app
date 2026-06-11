import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAllAllowedPriceIds } from "@/config/plans";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/serverUser";
import { checkRateLimit } from "@/lib/apiUtils";
import { captureRouteException } from "@/lib/monitoring";

const checkoutSchema = z.object({
  priceId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const { id: rateLimitUserId } = await getServerUser();
    if (!checkRateLimit(`billing-checkout:${rateLimitUserId}`, 10, 60_000)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again shortly." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    const allowedIds = getAllAllowedPriceIds();
    if (allowedIds.length > 0 && !allowedIds.includes(parsed.data.priceId)) {
      return NextResponse.json(
        { success: false, error: "Invalid price ID" },
        { status: 400 }
      );
    }

    const { id: userId, email } = await getServerUser();

    const user = await prisma.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await getStripe().customers.create({
        email: email ?? undefined,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    const origin = request.headers.get("origin") ?? "http://localhost:3001";

    const session = await getStripe().checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: parsed.data.priceId, quantity: 1 }],
      success_url: `${origin}/app/settings/billing?success=true`,
      cancel_url: `${origin}/app/subscribe?cancelled=true`,
      metadata: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      data: { url: session.url },
    });
  } catch (error) {
    captureRouteException("POST /api/billing/checkout", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
