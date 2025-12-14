"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-20 lg:pt-48 lg:pb-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          {/* Kicker */}
          <Reveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-[12px] font-medium text-neutral-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              Runway forecasting for early-stage SaaS
            </div>
          </Reveal>

          {/* Headline */}
          <Reveal delay={0.1}>
            <h1 className="text-[2.5rem] font-semibold leading-[1.1] tracking-tight text-neutral-900 md:text-[3rem] lg:text-[3.5rem]">
              Fundraising-ready runway forecasts in minutes.
            </h1>
          </Reveal>

          {/* Subheadline */}
          <Reveal delay={0.2}>
            <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-7 text-neutral-600 md:text-base md:leading-7">
              An opinionated budgeting tool for early-stage SaaS. Model revenue,
              hiring, and burn with simple inputs — and see runway and investor
              metrics instantly.
            </p>
          </Reveal>

          {/* CTAs */}
          <Reveal delay={0.3}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/signup"
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-[14px] font-medium text-white transition-all hover:bg-neutral-800 sm:w-auto"
              >
                Get started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/pricing"
                className="flex w-full items-center justify-center rounded-full border border-neutral-200 bg-white px-6 py-3 text-[14px] font-medium text-neutral-900 transition-colors hover:bg-neutral-50 sm:w-auto"
              >
                See pricing
              </Link>
            </div>
          </Reveal>

          {/* Trust line */}
          <Reveal delay={0.4}>
            <p className="mt-6 text-[13px] text-neutral-500">
              No integrations. No spreadsheets. Just a clear 12–24 month plan.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

