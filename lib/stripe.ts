import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export const PLANS = {
  free: {
    name: "Free",
    maxPlans: 1,
    maxScenarios: 1,
    features: ["Basic forecasting", "1 active plan", "Community support"],
  },
  growth: {
    name: "Growth",
    maxPlans: 10,
    maxScenarios: 5,
    features: [
      "Unlimited forecasting",
      "Up to 10 plans",
      "5 scenarios per plan",
      "PDF & CSV export",
      "Priority support",
    ],
    priceMonthly: process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID,
    priceYearly: process.env.STRIPE_GROWTH_YEARLY_PRICE_ID,
  },
} as const;

export type PlanTier = keyof typeof PLANS;
