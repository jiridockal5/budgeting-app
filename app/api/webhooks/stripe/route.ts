import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDelete(subscription);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId || !session.subscription) return;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;

  const sub = await stripe.subscriptions.retrieve(subscriptionId);

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeSubscriptionId: sub.id,
      stripePriceId: sub.items.data[0]?.price.id ?? "",
      status: mapStatus(sub.status),
      currentPeriodEnd: new Date(sub.currentPeriodEnd * 1000),
    },
    update: {
      stripeSubscriptionId: sub.id,
      stripePriceId: sub.items.data[0]?.price.id ?? "",
      status: mapStatus(sub.status),
      currentPeriodEnd: new Date(sub.currentPeriodEnd * 1000),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    },
  });
}

async function handleSubscriptionUpdate(sub: Stripe.Subscription) {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      stripeSubscriptionId: sub.id,
      stripePriceId: sub.items.data[0]?.price.id ?? "",
      status: mapStatus(sub.status),
      currentPeriodEnd: new Date(sub.currentPeriodEnd * 1000),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    },
    update: {
      stripePriceId: sub.items.data[0]?.price.id ?? "",
      status: mapStatus(sub.status),
      currentPeriodEnd: new Date(sub.currentPeriodEnd * 1000),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    },
  });
}

async function handleSubscriptionDelete(sub: Stripe.Subscription) {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  await prisma.subscription.updateMany({
    where: { userId: user.id },
    data: { status: "CANCELLED" },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) return;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  await prisma.subscription.updateMany({
    where: { userId: user.id },
    data: { status: "PAST_DUE" },
  });
}

function mapStatus(
  stripeStatus: Stripe.Subscription.Status
): "ACTIVE" | "PAST_DUE" | "CANCELLED" | "TRIALING" | "INCOMPLETE" {
  switch (stripeStatus) {
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
      return "CANCELLED";
    case "trialing":
      return "TRIALING";
    default:
      return "INCOMPLETE";
  }
}
