import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getTrialEndDate } from "@/lib/planGating";
import { getServerUser } from "@/lib/serverUser";

/**
 * Resolves the Prisma user for the current Supabase session.
 * Prefers auth id, falls back to email, and re-links the row when auth id drifted.
 */
export async function resolveDbUser(): Promise<User> {
  const { id: supabaseUserId, email } = await getServerUser();

  const byId = await prisma.user.findUnique({ where: { id: supabaseUserId } });
  if (byId) return byId;

  if (email) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      if (byEmail.id !== supabaseUserId) {
        return prisma.user.update({
          where: { id: byEmail.id },
          data: { id: supabaseUserId },
        });
      }
      return byEmail;
    }
  }

  return prisma.user.create({
    data: {
      id: supabaseUserId,
      email: email ?? "unknown@example.com",
      name: email?.split("@")[0] ?? "User",
      growthTrialEndsAt: getTrialEndDate(),
    },
  });
}
