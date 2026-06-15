"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Reveal } from "./Reveal";
import { Check, Sparkles } from "lucide-react";
import {
  type BillingCurrency,
  type BillingInterval,
  formatPrice,
  getCurrencySymbol,
  PLAN_FEATURES,
  PLAN_NAME,
  TRIAL_DAYS,
} from "@/config/plans";

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<BillingInterval>("monthly");
  const [currency, setCurrency] = useState<BillingCurrency>("eur");
  const prefersReducedMotion = useReducedMotion();

  const price = formatPrice(currency, billingPeriod);
  const symbol = getCurrencySymbol(currency);

  return (
    <section id="pricing" className="relative py-10 md:py-12 lg:py-14">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="text-center">
            <p className="text-[12px] font-medium uppercase tracking-wider text-neutral-500">
              Pricing
            </p>
            <h2 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-neutral-900 md:text-[2rem]">
              One plan. Full access.
            </h2>
            <p className="mt-3 text-[14px] text-neutral-500">
              {TRIAL_DAYS}-day free trial on signup. No credit card required.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <div className="inline-flex rounded-full border border-neutral-200 bg-white p-1">
              {(["eur", "usd"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`rounded-full px-4 py-2 text-[13px] font-medium uppercase transition-colors ${
                    currency === c
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
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
                  initial={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 0, scale: 0.9 }
                  }
                  animate={{ opacity: 1, scale: 1 }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.9 }
                  }
                  className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[12px] font-medium text-neutral-600"
                >
                  <Sparkles className="h-3 w-3" />
                  Save ~20%
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mx-auto mt-8 max-w-md md:mt-10">
            <div className="relative flex flex-col rounded-2xl border border-neutral-300 bg-white p-6 md:p-8">
              <div className="absolute -top-3 left-6">
                <span className="flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-3 py-1 text-[11px] font-semibold text-neutral-700">
                  <Sparkles className="h-3 w-3" />
                  {TRIAL_DAYS}-day free trial
                </span>
              </div>

              <h3 className="text-lg font-semibold text-neutral-900">
                {PLAN_NAME}
              </h3>
              <p className="mt-1 text-[14px] text-neutral-500">
                For people who want a clearer budget and cash-flow plan.
              </p>

              <div className="mt-4 flex items-baseline gap-1">
                <motion.span
                  key={`${currency}-${billingPeriod}`}
                  initial={
                    prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-bold tracking-tight text-neutral-900"
                >
                  {symbol}
                  {price.amount}
                </motion.span>
                <span className="text-[14px] text-neutral-500">
                  {price.period}
                </span>
              </div>
              {billingPeriod === "annual" && price.effectiveMonthly && (
                <p className="mt-1 text-[13px] text-neutral-600">
                  {symbol}
                  {price.effectiveMonthly}/mo billed annually
                </p>
              )}

              <ul className="mt-6 flex-1 space-y-3">
                {PLAN_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-[14px] text-neutral-600"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="mt-8 flex items-center justify-center rounded-full bg-neutral-900 px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800"
              >
                Start free trial
              </Link>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.3}>
          <p className="mt-6 text-center text-[13px] text-neutral-500">
            Need help setting up your budget?{" "}
            <button className="font-medium text-neutral-700 underline underline-offset-2 transition-colors hover:text-neutral-900">
              Contact us
            </button>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
