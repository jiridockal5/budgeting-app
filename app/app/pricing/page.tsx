"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { PageHeader } from "@/components/layout/PageHeader";
import { Check, Sparkles, CreditCard } from "lucide-react";

type BillingPeriod = "monthly" | "annual";

interface PlanConfig {
  name: string;
  price: {
    monthly: number;
    annual: number;
  };
  description: string;
  features: string[];
  cta: {
    loggedOut: string;
    loggedIn: string;
  };
  highlighted?: boolean;
}

const plans: PlanConfig[] = [
  {
    name: "Free",
    price: {
      monthly: 0,
      annual: 0,
    },
    description: "For founders validating their first budget.",
    features: [
      "1 active plan",
      "Basic revenue & expense forecasting",
      "Manual exports (CSV/Excel)",
      "Community support",
    ],
    cta: {
      loggedOut: "Get started for free",
      loggedIn: "Get started for free",
    },
  },
  {
    name: "Growth",
    price: {
      monthly: 29,
      annual: 299,
    },
    description: "For SaaS teams preparing for fundraising.",
    features: [
      "Multiple plans & scenarios",
      "Advanced SaaS metrics (CAC, LTV/CAC, NRR, burn multiple)",
      "Priority support",
      "Ready for investors & board reporting",
    ],
    cta: {
      loggedOut: "Upgrade to Growth",
      loggedIn: "Upgrade to Growth",
    },
    highlighted: true,
  },
];

interface PlanCardProps {
  plan: PlanConfig;
  billingPeriod: BillingPeriod;
  isLoggedIn: boolean | null;
  onCTAClick: () => void;
}

function PlanCard({ plan, billingPeriod, isLoggedIn, onCTAClick }: PlanCardProps) {
  const isFree = plan.price.monthly === 0;
  const price = isFree
    ? 0
    : billingPeriod === "monthly"
    ? plan.price.monthly
    : plan.price.annual;
  const periodLabel = isFree ? "" : billingPeriod === "monthly" ? "/month" : "/year";
  const ctaLabel = isLoggedIn ? plan.cta.loggedIn : plan.cta.loggedOut;
  const isLoading = isLoggedIn === null;

  // Billing helper text for Growth plan
  const billingHelper = isFree
    ? null
    : billingPeriod === "monthly"
    ? "Billed monthly. Cancel anytime."
    : "Billed yearly. Save 2 months compared to monthly.";

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
        plan.highlighted
          ? "border-indigo-200 bg-gradient-to-b from-indigo-50/50 to-white ring-2 ring-indigo-100"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      {/* Popular badge */}
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-600 shadow-sm">
            <Sparkles className="h-3 w-3" />
            Recommended
          </div>
        </div>
      )}

      {/* Plan name */}
      <div className="flex items-center gap-2">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            plan.highlighted ? "bg-indigo-100" : "bg-slate-100"
          }`}
        >
          <CreditCard
            className={`h-4 w-4 ${
              plan.highlighted ? "text-indigo-600" : "text-slate-600"
            }`}
          />
        </div>
        <h3
          className={`text-xl font-semibold ${
            plan.highlighted ? "text-indigo-900" : "text-slate-900"
          }`}
        >
          {plan.name}
        </h3>
      </div>

      {/* Price */}
      <div className="mt-5">
        <div className="flex items-baseline gap-1">
          <span
            className={`text-4xl font-bold tracking-tight ${
              plan.highlighted ? "text-indigo-900" : "text-slate-900"
            }`}
          >
            {price} €
          </span>
          {periodLabel && (
            <span className="text-sm font-medium text-slate-500">{periodLabel}</span>
          )}
        </div>
        {billingHelper && (
          <p className="mt-1.5 text-xs text-slate-500">{billingHelper}</p>
        )}
      </div>

      {/* Description */}
      <p className="mt-4 text-sm text-slate-600">{plan.description}</p>

      {/* Features list */}
      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-slate-600">
            <div
              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                plan.highlighted ? "bg-indigo-100" : "bg-slate-100"
              }`}
            >
              <Check
                className={`h-3 w-3 ${
                  plan.highlighted ? "text-indigo-600" : "text-slate-600"
                }`}
              />
            </div>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={onCTAClick}
        disabled={isLoading}
        className={`mt-8 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
          plan.highlighted
            ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-500 hover:shadow-lg active:bg-indigo-700"
            : "border border-slate-200 bg-white text-slate-900 shadow-sm hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100"
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
    const planName = plan.name.toLowerCase() as "free" | "growth";

    if (!isLoggedIn) {
      // Redirect to login/signup for unauthenticated users
      router.push("/login");
      return;
    }

    // Placeholder for future billing integration
    console.log("TODO: implement upgrade flow", {
      plan: planName,
      billingPeriod,
    });

    // Optional: Could show a toast notification here if a toast system exists
    // For now, just log to console
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <PageHeader
            title="Pricing"
            subtitle="Start for free and upgrade when you're ready to scale."
          />

          {/* Billing Toggle */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                  billingPeriod === "monthly"
                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("annual")}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                  billingPeriod === "annual"
                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Annual
              </button>
            </div>

            {billingPeriod === "annual" && (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                <Sparkles className="h-4 w-4" />
                Save 2 months
              </span>
            )}
          </div>

          {/* Plan Cards */}
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
            {plans.map((plan) => (
              <PlanCard
                key={plan.name}
                plan={plan}
                billingPeriod={billingPeriod}
                isLoggedIn={isLoggedIn}
                onCTAClick={() => handleCTAClick(plan)}
              />
            ))}
          </div>

          {/* Additional Info */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                <svg
                  className="h-5 w-5 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Questions about pricing?
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  All plans include a 14-day free trial. No credit card required to
                  start. Contact us if you need a custom enterprise plan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

