/**
 * Creates Burnlytics subscription prices in your Stripe sandbox (EUR + USD).
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

async function findOrCreateProduct(): Promise<Stripe.Product> {
  const existing = await stripe.products.search({
    query: 'metadata["app"]:"saas-forecast"',
  });
  const match = existing.data.find((p) => p.name === "Burnlytics");
  if (match) return match;

  return stripe.products.create({
    name: "Burnlytics",
    description: "Budget planning — cash-flow forecasts, metrics, and exports.",
    metadata: { app: "saas-forecast", tier: "growth" },
  });
}

async function findOrCreatePrice(
  productId: string,
  currency: "eur" | "usd",
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
      p.currency === currency
  );
  if (match) return match;

  return stripe.prices.create({
    product: productId,
    currency,
    unit_amount: unitAmount,
    recurring: { interval },
    metadata: { tier: "growth", interval, currency },
  });
}

async function main() {
  console.log("Setting up Stripe Burnlytics prices in sandbox...\n");

  const product = await findOrCreateProduct();
  console.log(`Product: ${product.name} (${product.id})\n`);

  const monthlyEur = await findOrCreatePrice(product.id, "eur", "month", 9900);
  const annualEur = await findOrCreatePrice(product.id, "eur", "year", 94800);
  const monthlyUsd = await findOrCreatePrice(product.id, "usd", "month", 10900);
  const annualUsd = await findOrCreatePrice(product.id, "usd", "year", 106800);

  console.log(`Monthly EUR: ${monthlyEur.id} (€99/mo)`);
  console.log(`Annual EUR:  ${annualEur.id} (€948/yr)`);
  console.log(`Monthly USD: ${monthlyUsd.id} ($109/mo)`);
  console.log(`Annual USD:  ${annualUsd.id} ($1,068/yr)`);

  console.log("\nAdd these lines to .env.local:\n");
  console.log(`STRIPE_GROWTH_MONTHLY_EUR_PRICE_ID=${monthlyEur.id}`);
  console.log(`STRIPE_GROWTH_ANNUAL_EUR_PRICE_ID=${annualEur.id}`);
  console.log(`STRIPE_GROWTH_MONTHLY_USD_PRICE_ID=${monthlyUsd.id}`);
  console.log(`STRIPE_GROWTH_ANNUAL_USD_PRICE_ID=${annualUsd.id}`);
  console.log(`NEXT_PUBLIC_STRIPE_GROWTH_MONTHLY_EUR_PRICE_ID=${monthlyEur.id}`);
  console.log(`NEXT_PUBLIC_STRIPE_GROWTH_ANNUAL_EUR_PRICE_ID=${annualEur.id}`);
  console.log(`NEXT_PUBLIC_STRIPE_GROWTH_MONTHLY_USD_PRICE_ID=${monthlyUsd.id}`);
  console.log(`NEXT_PUBLIC_STRIPE_GROWTH_ANNUAL_USD_PRICE_ID=${annualUsd.id}`);
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
