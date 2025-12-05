"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Check, Sparkles } from "lucide-react";

type BillingPeriod = "monthly" | "annual";

interface PlanConfig {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  tagline: string;
  description: string;
  features: string[];
  ctaLoggedOut: string;
  ctaLoggedIn: string;
  popular?: boolean;
}

const plans: PlanConfig[] = [
  {
    name: "Starter",
    monthlyPrice: 19,
    annualPrice: 199,
    tagline: "For founders who need a simple, reliable forecast.",
    description: "Ideal before your first fundraising.",
    features: ["Essential forecasting", "Investor-ready exports"],
    ctaLoggedOut: "Get Starter",
    ctaLoggedIn: "Use Starter",
  },
  {
    name: "Growth",
    monthlyPrice: 49,
    annualPrice: 499,
    tagline: "For SaaS teams planning seed/Series A.",
    description: "Build investor-ready forecasts in minutes.",
    features: [
      "Full forecasting suite",
      "Investor-ready exports",
      "Priority support",
    ],
    ctaLoggedOut: "Get Growth",
    ctaLoggedIn: "Upgrade",
    popular: true,
  },
];

interface PricingCardProps {
  plan: PlanConfig;
  billingPeriod: BillingPeriod;
  isLoggedIn: boolean | null;
  onCTAClick: () => void;
}

function PricingCard({
  plan,
  billingPeriod,
  isLoggedIn,
  onCTAClick,
}: PricingCardProps) {
  const price =
    billingPeriod === "monthly" ? plan.monthlyPrice : plan.annualPrice;
  const periodLabel = billingPeriod === "monthly" ? "/month" : "/year";
  const ctaLabel = isLoggedIn ? plan.ctaLoggedIn : plan.ctaLoggedOut;
  const isLoading = isLoggedIn === null;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 shadow-sm transition-transform hover:-translate-y-1 ${
        plan.popular
          ? "border-indigo-200 ring-2 ring-indigo-100"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-600 shadow">
            <Sparkles className="h-3 w-3" />
            Most popular
          </div>
        </div>
      )}

      {/* Plan name */}
      <h3
        className={`font-semibold text-slate-900 ${
          plan.popular ? "text-xl" : "text-lg"
        }`}
      >
        {plan.name}
      </h3>

      {/* Price */}
      <div className="mt-4 flex items-baseline gap-1">
        <span
          className={`font-bold tracking-tight text-slate-900 ${
            plan.popular ? "text-5xl" : "text-4xl"
          }`}
        >
          {price} €
        </span>
        <span className="text-sm text-slate-600">{periodLabel}</span>
      </div>

      {/* Tagline & description */}
      <div className="mt-5 flex-1 space-y-1.5">
        <p className="text-sm font-medium text-slate-900">{plan.tagline}</p>
        <p className="text-sm text-slate-600">{plan.description}</p>
      </div>

      {/* Features list */}
      <ul className="mt-6 space-y-2.5">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-2.5 text-sm text-slate-600"
          >
            <Check
              className={`h-4 w-4 flex-shrink-0 ${
                plan.popular ? "text-indigo-600" : "text-slate-500"
              }`}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={onCTAClick}
        disabled={isLoading}
        className={`mt-7 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          plan.popular
            ? "bg-indigo-600 text-white hover:bg-indigo-500"
            : "border border-slate-300 bg-white text-slate-900 hover:border-indigo-200"
        }`}
      >
        {isLoading ? "Loading..." : ctaLabel}
      </button>
    </div>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      setIsLoggedIn(!!data.user);
    };
    checkAuth();
  }, []);

  const handleCTAClick = (plan: PlanConfig) => {
    if (!isLoggedIn) {
      // Redirect to login for unauthenticated users
      router.push("/login");
      return;
    }

    // TODO: Integrate Stripe checkout / billing portal here
    // For Starter: Check if user already has a subscription, if not create checkout session
    // For Growth: Either create checkout session for new subscription or redirect to billing portal for upgrade
    // Example future implementation:
    // router.push(`/api/checkout?plan=${plan.name.toLowerCase()}&period=${billingPeriod}`);

    // For now, route to main authenticated area
    router.push("/app");
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Pricing
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Simple plans for SaaS founders.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            14-day free trial. No card.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                billingPeriod === "monthly"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                billingPeriod === "annual"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Annual
            </button>
          </div>

          {billingPeriod === "annual" && (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Save with annual billing
            </span>
          )}
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 sm:gap-8">
          {plans.map((plan) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              billingPeriod={billingPeriod}
              isLoggedIn={isLoggedIn}
              onCTAClick={() => handleCTAClick(plan)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
