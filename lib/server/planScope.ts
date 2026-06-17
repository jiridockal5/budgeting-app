import type { Plan } from "@prisma/client";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonErr } from "@/lib/server/apiEnvelope";
import { resolveDbUser } from "@/lib/server/dbUser";
import { requireAppAccess } from "@/lib/requireAppAccess";

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
