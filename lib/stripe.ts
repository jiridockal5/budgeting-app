import Stripe from "stripe";
import { PLAN_FEATURES, PLAN_NAME } from "@/config/plans";

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

export const SUBSCRIPTION_PLAN = {
  name: PLAN_NAME,
  maxPlans: Infinity,
  maxScenarios: Infinity,
  features: [...PLAN_FEATURES],
} as const;

/** @deprecated Use SUBSCRIPTION_PLAN */
export const PLANS = {
  growth: SUBSCRIPTION_PLAN,
  locked: {
    name: "Locked",
    maxPlans: 0,
    maxScenarios: 0,
    features: [] as string[],
  },
} as const;

export type PlanTier = keyof typeof PLANS;
