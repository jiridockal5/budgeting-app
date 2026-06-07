import Stripe from "stripe";
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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function main() {
  const subId = process.argv[2];
  if (!subId) {
    console.error("Usage: npx tsx scripts/cancel-subscription.ts <subscription_id>");
    process.exit(1);
  }
  const sub = await stripe.subscriptions.cancel(subId);
  console.log("Cancelled:", sub.id, sub.status);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
