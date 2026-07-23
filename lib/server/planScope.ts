import type { ForecastScenario, Plan } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonErr } from "@/lib/server/apiEnvelope";
import { resolveDbUser } from "@/lib/server/dbUser";
import { requireAppAccess } from "@/lib/requireAppAccess";
import { DEFAULT_REVENUE_CONFIG } from "@/lib/revenueForecast";
import { seedFreshScenarioInputs } from "@/lib/server/scenarioClone";

export type ScopedPlan =
  | { ok: true; userId: string; plan: Plan }
  | { ok: false; response: NextResponse };

/**
 * Resolves the current user and ensures the plan belongs to them.
 * Use this for any route keyed by planId to avoid duplicated auth checks.
 */
export async function getScopedPlan(planId: string): Promise<ScopedPlan> {
  const user = await resolveDbUser();
  const denied = await requireAppAccess(user.id);
  if (denied) {
    return { ok: false, response: denied };
  }
  const plan = await prisma.plan.findFirst({
    where: { id: planId, userId: user.id },
  });
  if (!plan) {
    return {
      ok: false,
      response: jsonErr("Plan not found for this user", 404),
    };
  }
  return { ok: true, userId: user.id, plan };
}

export type ScopedScenario =
  | { ok: true; userId: string; plan: Plan; scenario: ForecastScenario }
  | { ok: false; response: NextResponse };

/**
 * Resolves a scenario that belongs to the current user's plan.
 */
export async function getScopedScenario(
  scenarioId: string
): Promise<ScopedScenario> {
  const user = await resolveDbUser();
  const denied = await requireAppAccess(user.id);
  if (denied) {
    return { ok: false, response: denied };
  }
  const scenario = await prisma.forecastScenario.findFirst({
    where: { id: scenarioId, plan: { userId: user.id } },
    include: { plan: true },
  });
  if (!scenario) {
    return {
      ok: false,
      response: jsonErr("Scenario not found for this user", 404),
    };
  }
  return {
    ok: true,
    userId: user.id,
    plan: scenario.plan,
    scenario,
  };
}

/**
 * Resolve Default scenario for a plan, creating it with starter inputs if missing.
 */
export async function ensureDefaultScenario(plan: Plan): Promise<ForecastScenario> {
  const existing = await prisma.forecastScenario.findFirst({
    where: { planId: plan.id, name: "Default" },
  });
  if (existing) return existing;

  const scenario = await prisma.forecastScenario.create({
    data: {
      planId: plan.id,
      name: "Default",
      startMonth: plan.startMonth,
      months: plan.months,
      config: DEFAULT_REVENUE_CONFIG as unknown as Prisma.InputJsonValue,
    },
  });
  await seedFreshScenarioInputs(scenario.id, plan.id);
  return scenario;
}
