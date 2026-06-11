import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/serverUser";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getStripe } from "@/lib/stripe";
import { captureRouteException } from "@/lib/monitoring";
import { checkRateLimit } from "@/lib/apiUtils";

/**
 * DELETE /api/account
 *
 * Permanently deletes the signed-in user's account:
 * 1. Cancels any active Stripe subscription immediately.
 * 2. Deletes all app data (Prisma cascade from User).
 * 3. Deletes the Supabase auth user.
 */
export async function DELETE() {
  try {
    const serverUser = await getServerUser();

    if (serverUser.isFallback) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!checkRateLimit(`account-delete:${serverUser.id}`, 3, 60_000)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again shortly." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: serverUser.id },
          { email: serverUser.email ?? undefined },
        ],
      },
      include: { subscription: true },
    });

    // Cancel Stripe subscription so the customer is not billed again.
    if (user?.subscription?.stripeSubscriptionId) {
      try {
        await getStripe().subscriptions.cancel(
          user.subscription.stripeSubscriptionId
        );
      } catch (stripeError) {
        // Subscription may already be cancelled or Stripe unreachable —
        // log but don't block the deletion.
        captureRouteException("DELETE /api/account (stripe cancel)", stripeError);
      }
    }

    // Delete app data (cascades to plans, expenses, people, scenarios, etc.).
    if (user) {
      await prisma.user.delete({ where: { id: user.id } });
    }

    // Delete the Supabase auth user (sign-in identity).
    const { error: adminError } =
      await getSupabaseAdmin().auth.admin.deleteUser(serverUser.id);
    if (adminError) {
      captureRouteException("DELETE /api/account (auth delete)", adminError);
      return NextResponse.json(
        {
          success: false,
          error:
            "Your data was removed, but the sign-in account could not be deleted. Please contact support.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    captureRouteException("DELETE /api/account", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
