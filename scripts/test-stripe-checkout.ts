/**
 * Smoke test: verify Stripe keys and checkout session creation.
 * Run: npx tsx scripts/test-stripe-checkout.ts
 */
import Stripe from "stripe";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvFile(filename: string) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
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

loadEnvFile(".env.local");
loadEnvFile(".env");

const key = process.env.STRIPE_SECRET_KEY;
const monthlyPriceId = process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID;

if (!key) {
  console.error("FAIL: STRIPE_SECRET_KEY missing");
  process.exit(1);
}
if (!monthlyPriceId) {
  console.error("FAIL: STRIPE_GROWTH_MONTHLY_PRICE_ID missing");
  process.exit(1);
}

const stripe = new Stripe(key);

async function main() {
  console.log("1. Verifying Stripe account...");
  const account = await stripe.accounts.retrieve();
  console.log(`   OK — account ${account.id}`);

  console.log("2. Verifying Growth monthly price...");
  const price = await stripe.prices.retrieve(monthlyPriceId);
  console.log(
    `   OK — ${price.id} (${price.currency} ${(price.unit_amount ?? 0) / 100}/${price.recurring?.interval})`
  );

  console.log("3. Creating test checkout session...");
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: monthlyPriceId, quantity: 1 }],
    success_url: "http://localhost:3001/app/settings/billing?success=true",
    cancel_url: "http://localhost:3001/app/settings/billing?cancelled=true",
    metadata: { test: "smoke" },
  });

  if (!session.url) {
    console.error("FAIL: No checkout URL returned");
    process.exit(1);
  }

  console.log(`   OK — session ${session.id}`);
  console.log(`   Checkout URL: ${session.url}`);
  console.log("\nAll Stripe smoke tests passed.");
}

main().catch((err) => {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
