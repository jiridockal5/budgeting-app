export const TRIAL_DAYS = 7;

export type BillingCurrency = "eur" | "usd";
export type BillingInterval = "monthly" | "annual";
export type AccessState = "trial" | "paid" | "locked";

export const PRICING = {
  monthly: { eur: 99, usd: 109 },
  annual: {
    eur: 948,
    usd: 1068,
    effectiveMonthly: { eur: 79, usd: 89 },
  },
} as const;

export const PLAN_NAME = "Burnlytics";

export const PLAN_FEATURES = [
  "Unlimited plans & scenarios",
  "Full dashboard, SaaS & financial metrics",
  "PDF & CSV export",
  "Priority email support",
] as const;

const PRICE_ENV_KEYS: Record<
  BillingCurrency,
  Record<BillingInterval, { public: string; server: string }>
> = {
  eur: {
    monthly: {
      public: "NEXT_PUBLIC_STRIPE_GROWTH_MONTHLY_EUR_PRICE_ID",
      server: "STRIPE_GROWTH_MONTHLY_EUR_PRICE_ID",
    },
    annual: {
      public: "NEXT_PUBLIC_STRIPE_GROWTH_ANNUAL_EUR_PRICE_ID",
      server: "STRIPE_GROWTH_ANNUAL_EUR_PRICE_ID",
    },
  },
  usd: {
    monthly: {
      public: "NEXT_PUBLIC_STRIPE_GROWTH_MONTHLY_USD_PRICE_ID",
      server: "STRIPE_GROWTH_MONTHLY_USD_PRICE_ID",
    },
    annual: {
      public: "NEXT_PUBLIC_STRIPE_GROWTH_ANNUAL_USD_PRICE_ID",
      server: "STRIPE_GROWTH_ANNUAL_USD_PRICE_ID",
    },
  },
};

export function getPublicStripePriceId(
  currency: BillingCurrency,
  interval: BillingInterval
): string {
  const key = PRICE_ENV_KEYS[currency][interval].public;
  return process.env[key] ?? "";
}

export function getServerStripePriceId(
  currency: BillingCurrency,
  interval: BillingInterval
): string {
  const keys = PRICE_ENV_KEYS[currency][interval];
  return process.env[keys.server] ?? process.env[keys.public] ?? "";
}

export function getAllAllowedPriceIds(): string[] {
  const ids = new Set<string>();
  for (const currency of ["eur", "usd"] as const) {
    for (const interval of ["monthly", "annual"] as const) {
      const id = getServerStripePriceId(currency, interval);
      if (id) ids.add(id);
    }
  }
  return [...ids];
}

export function formatPrice(
  currency: BillingCurrency,
  interval: BillingInterval
): { amount: number; period: string; effectiveMonthly?: number } {
  if (interval === "monthly") {
    return {
      amount: PRICING.monthly[currency],
      period: "/month",
    };
  }
  return {
    amount: PRICING.annual[currency],
    period: "/year",
    effectiveMonthly: PRICING.annual.effectiveMonthly[currency],
  };
}

export function getCurrencySymbol(currency: BillingCurrency): string {
  return currency === "eur" ? "€" : "$";
}
