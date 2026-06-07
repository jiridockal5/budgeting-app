/**
 * Creates the Growth plan product and prices in your Stripe sandbox.
 * Run locally after adding STRIPE_SECRET_KEY to .env.local — never commit keys.
 *
 *   npm run setup:stripe
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
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error(
    "Missing STRIPE_SECRET_KEY. Add it to .env.local (from Stripe Dashboard → Developers → API keys)."
  );
  process.exit(1);
}

const stripe = new Stripe(key);

async function findOrCreateGrowthProduct(): Promise<Stripe.Product> {
  const existing = await stripe.products.search({
    query: 'metadata["app"]:"saas-forecast"',
  });
  const match = existing.data.find((p) => p.name === "Growth");
  if (match) return match;

  return stripe.products.create({
    name: "Growth",
    description: "For SaaS teams preparing for fundraising.",
    metadata: { app: "saas-forecast", tier: "growth" },
  });
}

async function findOrCreatePrice(
  productId: string,
  interval: "month" | "year",
  unitAmount: number
): Promise<Stripe.Price> {
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  });

  const match = prices.data.find(
    (p) =>
      p.recurring?.interval === interval &&
      p.unit_amount === unitAmount &&
      p.currency === "eur"
  );
  if (match) return match;

  return stripe.prices.create({
    product: productId,
    currency: "eur",
    unit_amount: unitAmount,
    recurring: { interval },
    metadata: { tier: "growth", interval },
  });
}

async function main() {
  console.log("Setting up Stripe Growth plan in sandbox...\n");

  const product = await findOrCreateGrowthProduct();
  console.log(`Product: ${product.name} (${product.id})`);

  const monthly = await findOrCreatePrice(product.id, "month", 2900);
  const yearly = await findOrCreatePrice(product.id, "year", 29900);

  console.log(`Monthly price: ${monthly.id} (€29/mo)`);
  console.log(`Yearly price:  ${yearly.id} (€299/yr)`);

  console.log("\nAdd these lines to .env.local:\n");
  console.log(`STRIPE_GROWTH_MONTHLY_PRICE_ID=${monthly.id}`);
  console.log(`STRIPE_GROWTH_YEARLY_PRICE_ID=${yearly.id}`);
  console.log(`NEXT_PUBLIC_STRIPE_GROWTH_MONTHLY_PRICE_ID=${monthly.id}`);
  console.log(`NEXT_PUBLIC_STRIPE_GROWTH_YEARLY_PRICE_ID=${yearly.id}`);
  console.log("\nFor webhooks locally, run:");
  console.log(
    "  stripe listen --forward-to localhost:3001/api/webhooks/stripe"
  );
  console.log("Then add the whsec_... secret as STRIPE_WEBHOOK_SECRET.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
