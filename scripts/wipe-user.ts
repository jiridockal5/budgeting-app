/**
 * One-off: wipe a user's app-DB data so they can re-test the new-user flow.
 *
 * Does NOT touch Supabase Auth — next login by the same email will
 * recreate the app DB user via /api/plans/current.
 *
 * Run with:
 *   npx tsx scripts/wipe-user.ts <email>
 */
import { prisma } from "@/lib/prisma";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/wipe-user.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      plans: { select: { id: true, name: true } },
      organizations: { select: { id: true } },
      subscription: { select: { id: true } },
    },
  });

  if (!user) {
    console.log(`No app-DB user found for email: ${email}`);
    console.log(
      "Nothing to do (Supabase Auth user — if any — is untouched). Done."
    );
    return;
  }

  console.log(`Found app-DB user ${user.id} (${user.email}):`);
  console.log(`  plans:         ${user.plans.length}`);
  console.log(`  organizations: ${user.organizations.length}`);
  console.log(`  subscription:  ${user.subscription ? "yes" : "no"}`);

  // Count children for visibility (cascade will handle deletion).
  const [expenses, people, scenarios, assumptions] = await Promise.all([
    prisma.expense.count({ where: { plan: { userId: user.id } } }),
    prisma.person.count({ where: { plan: { userId: user.id } } }),
    prisma.forecastScenario.count({ where: { plan: { userId: user.id } } }),
    prisma.globalAssumptions.count({ where: { plan: { userId: user.id } } }),
  ]);
  console.log(`  expenses rows: ${expenses}`);
  console.log(`  people rows:   ${people}`);
  console.log(`  scenarios:     ${scenarios}`);
  console.log(`  assumptions:   ${assumptions}`);

  console.log("\nDeleting user (cascades will remove all related rows)…");
  const deleted = await prisma.user.delete({ where: { id: user.id } });
  console.log(`Deleted user ${deleted.id} (${deleted.email}).`);

  const stillThere = await prisma.user.findUnique({ where: { email } });
  if (stillThere) {
    console.error("Unexpected: user still present after delete.");
    process.exit(2);
  }
  console.log("Verified: no app-DB user remains for that email.");
  console.log(
    "Next sign-in with the same email will recreate a fresh user + default plan."
  );
}

main()
  .catch((err) => {
    console.error("Wipe failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
