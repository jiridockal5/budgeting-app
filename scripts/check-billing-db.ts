import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";

function loadEnv(filename: string) {
  if (!existsSync(filename)) return;
  for (const line of readFileSync(filename, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(".env");

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { stripeCustomerId: { not: null } },
    include: { subscription: true },
    take: 5,
  });

  console.log(`Users with Stripe customer ID: ${users.length}`);
  for (const user of users) {
    console.log({
      email: user.email,
      stripeCustomerId: user.stripeCustomerId,
      subscription: user.subscription
        ? {
            status: user.subscription.status,
            stripeSubscriptionId: user.subscription.stripeSubscriptionId,
            stripePriceId: user.subscription.stripePriceId,
            currentPeriodEnd: user.subscription.currentPeriodEnd.toISOString(),
          }
        : null,
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
