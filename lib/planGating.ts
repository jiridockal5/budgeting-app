import { BILLING_GATE_ENABLED, TRIAL_DAYS, type AccessState } from "@/config/plans";
import { prisma } from "./prisma";
import { SUBSCRIPTION_PLAN } from "./stripe";

export type { AccessState };

export interface UserAccessInfo {
  state: AccessState;
  hasAppAccess: boolean;
  isOnTrial: boolean;
  isPaid: boolean;
  trialEndsAt: string | null;
  trialDaysLeft: number | null;
  plan: typeof SUBSCRIPTION_PLAN;
}

/**
 * Days of continued access after a payment fails (status PAST_DUE),
 * giving Stripe's dunning/retry cycle time to recover the payment
 * before the user is locked out.
 */
export const PAST_DUE_GRACE_DAYS = 7;

/** Comma-separated emails in FREE_ACCESS_EMAILS bypass billing (server-only). */
export function hasFreeAccessEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.FREE_ACCESS_EMAILS ?? "";
  const allowed = new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
  return allowed.has(email.trim().toLowerCase());
}

function isActiveSubscription(sub: {
  status: string;
  currentPeriodEnd: Date;
} | null): boolean {
  if (!sub) return false;
  const now = new Date();

  if (
    (sub.status === "ACTIVE" || sub.status === "TRIALING") &&
    sub.currentPeriodEnd > now
  ) {
    return true;
  }

  if (sub.status === "PAST_DUE") {
    const graceEnd = new Date(
      sub.currentPeriodEnd.getTime() + PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000
    );
    return graceEnd > now;
  }

  return false;
}

function trialDaysLeft(trialEndsAt: Date | null): number | null {
  if (!trialEndsAt) return null;
  const ms = trialEndsAt.getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function computeAccessState(input: {
  growthTrialEndsAt: Date | null;
  subscription: { status: string; currentPeriodEnd: Date } | null;
}): AccessState {
  if (isActiveSubscription(input.subscription)) {
    return "paid";
  }
  if (input.growthTrialEndsAt && input.growthTrialEndsAt > new Date()) {
    return "trial";
  }
  return "locked";
}

function freeAccessInfo(trialEndsAt: Date | null = null): UserAccessInfo {
  return {
    state: "paid",
    hasAppAccess: true,
    isOnTrial: false,
    isPaid: true,
    trialEndsAt: trialEndsAt?.toISOString() ?? null,
    trialDaysLeft: null,
    plan: SUBSCRIPTION_PLAN,
  };
}

export async function getUserAccessInfo(
  userId: string,
  authEmail?: string | null
): Promise<UserAccessInfo> {
  if (!BILLING_GATE_ENABLED) {
    return freeAccessInfo();
  }

  if (hasFreeAccessEmail(authEmail)) {
    return freeAccessInfo();
  }

  try {
    const user = await prisma.user.findFirst({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return {
        state: "locked",
        hasAppAccess: false,
        isOnTrial: false,
        isPaid: false,
        trialEndsAt: null,
        trialDaysLeft: null,
        plan: SUBSCRIPTION_PLAN,
      };
    }

    if (hasFreeAccessEmail(user.email)) {
      return freeAccessInfo(user.growthTrialEndsAt);
    }

    const state = computeAccessState({
      growthTrialEndsAt: user.growthTrialEndsAt,
      subscription: user.subscription,
    });

    const daysLeft = trialDaysLeft(user.growthTrialEndsAt);

    return {
      state,
      hasAppAccess: state !== "locked",
      isOnTrial: state === "trial",
      isPaid: state === "paid",
      trialEndsAt: user.growthTrialEndsAt?.toISOString() ?? null,
      trialDaysLeft: state === "trial" ? daysLeft : null,
      plan: SUBSCRIPTION_PLAN,
    };
  } catch {
    return {
      state: "locked",
      hasAppAccess: false,
      isOnTrial: false,
      isPaid: false,
      trialEndsAt: null,
      trialDaysLeft: null,
      plan: SUBSCRIPTION_PLAN,
    };
  }
}

export function getTrialEndDate(from: Date = new Date()): Date {
  return new Date(from.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

export async function checkPlanLimit(userId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  maxAllowed: number;
}> {
  const { hasAppAccess } = await getUserAccessInfo(userId);
  const currentCount = await prisma.plan.count({ where: { userId } });

  return {
    allowed: hasAppAccess,
    currentCount,
    maxAllowed: SUBSCRIPTION_PLAN.maxPlans,
  };
}

export async function checkScenarioLimit(
  userId: string,
  planId: string
): Promise<{
  allowed: boolean;
  currentCount: number;
  maxAllowed: number;
}> {
  const { hasAppAccess } = await getUserAccessInfo(userId);
  const currentCount = await prisma.forecastScenario.count({ where: { planId } });

  return {
    allowed: hasAppAccess,
    currentCount,
    maxAllowed: SUBSCRIPTION_PLAN.maxScenarios,
  };
}

export function canExport(hasAppAccess: boolean): boolean {
  return hasAppAccess;
}
