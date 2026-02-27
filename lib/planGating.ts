import { prisma } from "./prisma";
import { PLANS, type PlanTier } from "./stripe";

export async function getUserTier(userId: string): Promise<PlanTier> {
  const user = await prisma.user.findFirst({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user?.subscription) return "free";

  const sub = user.subscription;
  const isActive =
    (sub.status === "ACTIVE" || sub.status === "TRIALING") &&
    new Date(sub.currentPeriodEnd) > new Date();

  return isActive ? "growth" : "free";
}

export async function checkPlanLimit(userId: string): Promise<{
  allowed: boolean;
  tier: PlanTier;
  currentCount: number;
  maxAllowed: number;
}> {
  const tier = await getUserTier(userId);
  const limits = PLANS[tier];

  const currentCount = await prisma.plan.count({
    where: { userId },
  });

  return {
    allowed: currentCount < limits.maxPlans,
    tier,
    currentCount,
    maxAllowed: limits.maxPlans,
  };
}

export async function checkScenarioLimit(
  userId: string,
  planId: string
): Promise<{
  allowed: boolean;
  tier: PlanTier;
  currentCount: number;
  maxAllowed: number;
}> {
  const tier = await getUserTier(userId);
  const limits = PLANS[tier];

  const currentCount = await prisma.forecastScenario.count({
    where: { planId },
  });

  return {
    allowed: currentCount < limits.maxScenarios,
    tier,
    currentCount,
    maxAllowed: limits.maxScenarios,
  };
}

export function canExport(tier: PlanTier): boolean {
  return tier === "growth";
}
