import type { Plan } from "@prisma/client";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonErr } from "@/lib/server/apiEnvelope";
import { getServerUser } from "@/lib/serverUser";

export type ScopedPlan =
  | { ok: true; userId: string; plan: Plan }
  | { ok: false; response: NextResponse };

/**
 * Resolves the current user and ensures the plan belongs to them.
 * Use this for any route keyed by planId to avoid duplicated auth checks.
 */
export async function getScopedPlan(planId: string): Promise<ScopedPlan> {
  const { id: userId } = await getServerUser();
  const plan = await prisma.plan.findFirst({
    where: { id: planId, userId },
  });
  if (!plan) {
    return {
      ok: false,
      response: jsonErr("Plan not found for this user", 404),
    };
  }
  return { ok: true, userId, plan };
}
