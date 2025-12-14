"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { Check, Sparkles } from "lucide-react";

type BillingPeriod = "monthly" | "annual";

interface Plan {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  tagline: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    tagline: "For founders validating their first budget.",
    description: "",
    features: [
      "1 active plan",
      "Basic revenue & expense forecasting",
      "Manual exports (CSV/Excel)",
      "Community support",
    ],
    cta: "Get started for free",
  },
  {
    name: "Growth",
    monthlyPrice: 29,
    annualPrice: 299,
    tagline: "For SaaS teams preparing for fundraising.",
    description: "Billed monthly. Cancel anytime.",
    features: [
      "Multiple plans & scenarios",
      "Advanced SaaS metrics (CAC, LTV/CAC, NRR, burn multiple)",
      "Priority support",
      "Ready for investors & board reporting",
    ],
    cta: "Upgrade to Growth",
    popular: true,
  },
];

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="pricing" className="relative py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="text-center">
            <p className="text-[12px] font-medium uppercase tracking-wider text-neutral-500">
              Pricing
            </p>
            <h2 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-neutral-900 md:text-[2rem]">
              Simple pricing. Two plans.
            </h2>
            <p className="mt-3 text-[14px] text-neutral-500">
              Start for free and upgrade when you&apos;re ready to scale.
            </p>
          </div>
        </Reveal>

        {/* Billing toggle */}
        <Reveal delay={0.1}>
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="inline-flex rounded-full border border-neutral-200 bg-white p-1">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                  billingPeriod === "monthly"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("annual")}
                className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                  billingPeriod === "annual"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Annual
              </button>
            </div>
            <AnimatePresence mode="wait">
              {billingPeriod === "annual" && (
                <motion.span
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[12px] font-medium text-neutral-600"
                >
                  <Sparkles className="h-3 w-3" />
                  Save 2 months
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </Reveal>

        {/* Pricing cards */}
        <RevealGroup className="mt-10 grid gap-6 md:mt-12 md:grid-cols-2 md:gap-8">
          {plans.map((plan) => (
            <RevealItem key={plan.name}>
              <PricingCard
                plan={plan}
                billingPeriod={billingPeriod}
                prefersReducedMotion={prefersReducedMotion}
              />
            </RevealItem>
          ))}
        </RevealGroup>

        {/* Contact note */}
        <Reveal delay={0.3}>
          <p className="mt-8 text-center text-[13px] text-neutral-500">
            Need a demo or help with your model?{" "}
            <button className="font-medium text-neutral-700 underline underline-offset-2 transition-colors hover:text-neutral-900">
              Contact us
            </button>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function PricingCard({
  plan,
  billingPeriod,
  prefersReducedMotion,
}: {
  plan: Plan;
  billingPeriod: BillingPeriod;
  prefersReducedMotion: boolean | null;
}) {
  const price =
    billingPeriod === "monthly" ? plan.monthlyPrice : plan.annualPrice;
  const isFree = plan.monthlyPrice === 0;
  const periodLabel = isFree ? "" : billingPeriod === "monthly" ? "/month" : "/year";
  
  // Dynamic description for Growth plan based on billing period
  const description = plan.name === "Growth" 
    ? billingPeriod === "monthly" 
      ? "Billed monthly. Cancel anytime."
      : "Billed yearly. Save 2 months compared to monthly."
    : plan.description;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-colors md:p-8 ${
        plan.popular
          ? "border-neutral-300 bg-white"
          : "border-neutral-200 bg-white hover:border-neutral-300"
      }`}
    >
      {/* Recommended badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-6">
          <span className="flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-3 py-1 text-[11px] font-semibold text-neutral-700">
            <Sparkles className="h-3 w-3" />
            Recommended
          </span>
        </div>
      )}

      {/* Plan name */}
      <h3 className="text-lg font-semibold text-neutral-900">{plan.name}</h3>

      {/* Price */}
      <div className="mt-3 flex items-baseline gap-1">
        <AnimatePresence mode="wait">
          <motion.span
            key={`${plan.name}-${billingPeriod}`}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="text-4xl font-bold tracking-tight text-neutral-900"
          >
            €{price}
          </motion.span>
        </AnimatePresence>
        <span className="text-[14px] text-neutral-500">{periodLabel}</span>
      </div>

      {/* Tagline & description */}
      <div className="mt-4 space-y-1">
        <p className="text-[14px] font-medium text-neutral-900">{plan.tagline}</p>
        {description && (
          <p className="text-[13px] text-neutral-500">{description}</p>
        )}
      </div>

      {/* Features */}
      <ul className="mt-5 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-3 text-[14px] text-neutral-600"
          >
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href="/signup"
        className={`mt-8 flex items-center justify-center rounded-full px-6 py-3 text-[14px] font-medium transition-colors ${
          plan.popular
            ? "bg-neutral-900 text-white hover:bg-neutral-800"
            : "border border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300 hover:bg-neutral-50"
        }`}
      >
        {plan.cta}
      </Link>
    </div>
  );
}

